# Mantieni esposti tutti i metodi del bridge JavaScript WebView
-keepclassmembers class com.palazzochigi.warroom.MainActivity$AndroidNativeBridge {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes *Annotation*
