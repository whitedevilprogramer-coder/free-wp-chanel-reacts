# ReactHub — Vercel backend

## Deploy
1. Upload this project to a private GitHub repository.
2. Import it into Vercel.
3. In Vercel → Project → Settings → Environment Variables, add:
   - Name: `SASA_API_KEY`
   - Value: your SASA DEV API key
   - Environments: Production (and Preview if needed)
4. Redeploy after adding the environment variable.

The frontend calls `/api/react`; the provider key is only used inside `api/react.js`.
The Pro endpoint is selected by default because the standard endpoint reported scheduled maintenance.
You can select Standard in the UI to test it again after the provider restores it.

## Notes
- This project cannot force the provider to process reactions while its endpoint is paused or unavailable.
- If the Pro endpoint returns an error, the UI will show the provider response rather than falsely claiming success.
- Since the API key was pasted into a chat and a browser URL previously, consider rotating it in the provider dashboard before public deployment.
