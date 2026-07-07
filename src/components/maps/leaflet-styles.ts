// أنماط Leaflet — مفصولة عن الحزمة العامة (route-scoped، ليست في الجذر).
//
// تُستورد هذه الوحدة **فقط** من مكوّنات الخرائط الداخلية التي تُحمَّل ديناميكياً
// (dynamic import, ssr:false). بما أنّها dynamic chunks، يُحقن CSS الخرائط في chunk
// الخريطة فيُحمَّل عند فتح صفحة بها خريطة فقط — لا على كل صفحة (تسجيل دخول/تسويق/لوحة).
// هذا يخفّف الحزمة العامة (~18KB) على غالبية الصفحات التي لا خرائط فيها.
//
// نُبقيها 3 ملفات منفصلة (لا دمج) — التجميع build-time من node_modules يُخدَم من
// 'self' فيتوافق مع CSP: style-src 'self' (لا اعتماد على unpkg).
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
