# connecting ZenFB to Supabase

## 1. Credentials
- **Supabase URL**: `https://YOUR_PROJECT_ID.supabase.co`
- **Anon Key**: `YOUR_ANON_KEY`

## 2. Manifest Updates
Add your Supabase URL to `manifest.json`:
```json
"host_permissions": [
  "https://YOUR_PROJECT_ID.supabase.co/*"
],
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self'; connect-src 'self' https://YOUR_PROJECT_ID.supabase.co"
}
```

## 3. Client Setup (CDN Method)
Include this in `popup.html`:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

In `popup.js`:
```javascript
const { createClient } = supabase;
const client = createClient('URL', 'KEY');
```
