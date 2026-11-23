package com.palazzochigi.warroom

import android.annotation.SuppressLint
import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.view.View
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.webkit.WebViewAssetLoader

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var lastBackPressedMs: Long = 0L

    companion object {
        private const val START_URL =
            "https://appassets.androidplatform.net/assets/www/index.html"
        private const val WAR_ROOM_BG_HEX = "#090D16"
        private const val DEFAULT_APK_FILE = "PalazzoChigi-WarRoom.apk"
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        configureImmersiveFullscreen()

        webView = WebView(this).apply {
            setBackgroundColor(Color.parseColor(WAR_ROOM_BG_HEX))
            overScrollMode = View.OVER_SCROLL_NEVER
        }
        setContentView(webView)

        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        configureWebSettings(webView.settings)

        webView.addJavascriptInterface(AndroidNativeBridge(this), "AndroidNative")

        webView.webChromeClient = WebChromeClient()
        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? {
                return assetLoader.shouldInterceptRequest(request.url)
            }

            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest
            ): Boolean {
                val uri = request.url
                val host = uri.host?.lowercase().orEmpty()
                if (host == "appassets.androidplatform.net") {
                    return false
                }
                if (uri.scheme == "https" || uri.scheme == "http") {
                    try {
                        startActivity(Intent(Intent.ACTION_VIEW, uri))
                    } catch (_: Exception) {
                        // Ignora se non è presente alcun browser esterno
                    }
                    return true
                }
                return false
            }
        }

        setupBackNavigation()

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState)
        } else {
            webView.loadUrl(START_URL)
        }
    }

    @Suppress("DEPRECATION")
    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebSettings(settings: WebSettings) {
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.allowFileAccess = false
        settings.allowContentAccess = false
        settings.mediaPlaybackRequiresUserGesture = false
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
        settings.setSupportZoom(false)
        settings.builtInZoomControls = false
        settings.displayZoomControls = false
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.cacheMode = WebSettings.LOAD_DEFAULT
    }

    private fun configureImmersiveFullscreen() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = Color.parseColor(WAR_ROOM_BG_HEX)
        window.navigationBarColor = Color.parseColor(WAR_ROOM_BG_HEX)

        val controller = WindowInsetsControllerCompat(window, window.decorView)
        controller.isAppearanceLightStatusBars = false
        controller.isAppearanceLightNavigationBars = false
        controller.systemBarsBehavior =
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        controller.hide(WindowInsetsCompat.Type.systemBars())
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            configureImmersiveFullscreen()
        }
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (::webView.isInitialized && webView.canGoBack()) {
                    webView.goBack()
                    return
                }
                val now = System.currentTimeMillis()
                if (now - lastBackPressedMs < 2000L) {
                    finish()
                } else {
                    lastBackPressedMs = now
                    Toast.makeText(
                        this@MainActivity,
                        "Premi di nuovo Indietro per uscire",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
        })
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        if (::webView.isInitialized) {
            webView.saveState(outState)
        }
    }

    override fun onResume() {
        super.onResume()
        if (::webView.isInitialized) {
            webView.onResume()
        }
    }

    override fun onPause() {
        if (::webView.isInitialized) {
            webView.onPause()
        }
        super.onPause()
    }

    override fun onDestroy() {
        if (::webView.isInitialized) {
            webView.removeJavascriptInterface("AndroidNative")
            webView.destroy()
        }
        super.onDestroy()
    }

    inner class AndroidNativeBridge(private val context: Context) {

        @JavascriptInterface
        fun getAppVersion(): String {
            return try {
                val pkgInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    context.packageManager.getPackageInfo(
                        context.packageName,
                        PackageManager.PackageInfoFlags.of(0)
                    )
                } else {
                    @Suppress("DEPRECATION")
                    context.packageManager.getPackageInfo(context.packageName, 0)
                }
                pkgInfo.versionName ?: "1.0.0"
            } catch (_: Exception) {
                "1.0.0"
            }
        }

        @JavascriptInterface
        fun downloadAndInstallApk(apkUrl: String, fileName: String?) {
            val uri = try {
                Uri.parse(apkUrl.trim())
            } catch (_: Exception) {
                return
            }

            val scheme = uri.scheme?.lowercase().orEmpty()
            val host = uri.host?.lowercase().orEmpty()
            val isTrustedGithubHost = scheme == "https" && (
                host == "github.com" ||
                    host.endsWith(".github.com") ||
                    host.endsWith(".githubusercontent.com")
                )

            if (!isTrustedGithubHost) {
                runOnUiThread {
                    Toast.makeText(
                        context,
                        "URL di aggiornamento non valido.",
                        Toast.LENGTH_SHORT
                    ).show()
                }
                return
            }

            val rawName = fileName?.trim().orEmpty()
            val sanitizedBase = rawName
                .substringAfterLast('/')
                .replace(Regex("[^a-zA-Z0-9._-]"), "")
                .ifBlank { DEFAULT_APK_FILE }
            val safeFileName = if (sanitizedBase.lowercase().endsWith(".apk")) {
                sanitizedBase
            } else {
                DEFAULT_APK_FILE
            }

            try {
                val request = DownloadManager.Request(uri).apply {
                    setTitle("Palazzo Chigi // War Room")
                    setDescription("Download aggiornamento $safeFileName")
                    setMimeType("application/vnd.android.package-archive")
                    setNotificationVisibility(
                        DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED
                    )
                    setAllowedOverMetered(true)
                    setAllowedOverRoaming(true)
                    setDestinationInExternalPublicDir(
                        Environment.DIRECTORY_DOWNLOADS,
                        safeFileName
                    )
                }

                val manager = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
                manager.enqueue(request)

                runOnUiThread {
                    Toast.makeText(
                        context,
                        "Download avviato in Download/$safeFileName",
                        Toast.LENGTH_LONG
                    ).show()
                }
            } catch (_: Exception) {
                // Fallback sicuro: apre la pagina della GitHub Release nel browser di sistema
                runOnUiThread {
                    try {
                        startActivity(Intent(Intent.ACTION_VIEW, uri))
                    } catch (_: Exception) {
                        Toast.makeText(
                            context,
                            "Impossibile avviare il download dell'APK.",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                }
            }
        }
    }
}
