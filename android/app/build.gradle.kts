plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

val resolvedVersionName = (project.findProperty("appVersionName") as String?)
    ?.takeIf { it.isNotBlank() }
    ?: "1.0.0"

val resolvedVersionCode = (project.findProperty("appVersionCode") as String?)
    ?.toIntOrNull()
    ?: 10000

val keystorePath = System.getenv("ANDROID_KEYSTORE_PATH")
    ?: (project.findProperty("androidKeystorePath") as String?)
val keystorePassword = System.getenv("ANDROID_KEYSTORE_PASSWORD")
    ?: (project.findProperty("androidKeystorePassword") as String?)
val keyAliasValue = System.getenv("ANDROID_KEY_ALIAS")
    ?: (project.findProperty("androidKeyAlias") as String?)
val keyPasswordValue = System.getenv("ANDROID_KEY_PASSWORD")
    ?: (project.findProperty("androidKeyPassword") as String?)

val hasReleaseKeystore = !keystorePath.isNullOrBlank()
    && file(keystorePath).exists()
    && !keystorePassword.isNullOrBlank()
    && !keyAliasValue.isNullOrBlank()
    && !keyPasswordValue.isNullOrBlank()

android {
    namespace = "com.palazzochigi.warroom"
    compileSdk = 34

    defaultConfig {
        // Application ID fisso per preservare al 100% localStorage e i 3 slot salvati ad ogni aggiornamento APK
        applicationId = "com.palazzochigi.warroom"
        minSdk = 24
        targetSdk = 34
        versionCode = resolvedVersionCode
        versionName = resolvedVersionName
    }

    signingConfigs {
        if (hasReleaseKeystore) {
            create("release") {
                storeFile = file(keystorePath!!)
                storePassword = keystorePassword
                keyAlias = keyAliasValue
                keyPassword = keyPasswordValue
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            isShrinkResources = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = if (hasReleaseKeystore) {
                signingConfigs.getByName("release")
            } else {
                signingConfigs.getByName("debug")
            }
        }
        debug {
            isDebuggable = true
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.activity:activity-ktx:1.9.1")
    implementation("androidx.webkit:webkit:1.11.0")
}
