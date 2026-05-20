# Chabbra's Heaven Heights Landing Page

This is a static one-page pre-launch landing site built with modular React components loaded directly in the browser through ES modules. There is no backend dependency for the current enquiry flow.

## Files

- `index.html`: page entry point
- `src/main.js`: React bootstrap
- `src/app.js`: reusable landing page components
- `src/data.js`: content and section data
- `src/styles.css`: luxury dark theme styling

## Form Behavior

- Validates `name` and `phone`
- Shows a success message after submit
- Logs submitted enquiry data to the browser console

## Local Preview

Run a static server from this folder, for example:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Deployment

This can be deployed as a static site on any host that serves HTML files, such as:

- Netlify
- Vercel
- GitHub Pages
- Shared hosting with a custom domain

Point the domain to the deployed static folder and the landing page will work without additional backend setup for the current enquiry experience.
