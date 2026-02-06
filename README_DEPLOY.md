# Deployment Instructions

## Docker

1. Build the Docker image:
   ```sh
   docker build -t succes-dual-translator .
   ```
2. Run the container:
   ```sh
   docker run -p 3000:3000 --env-file .env succes-dual-translator
   ```

## Vercel

1. Install the Vercel CLI if you haven't:
   ```sh
   npm i -g vercel
   ```
2. Link your project and set the `GEMINI_API_KEY` in the Vercel dashboard or with:
   ```sh
   vercel env add GEMINI_API_KEY
   ```
3. Deploy:
   ```sh
   vercel --prod
   ```

---

- Ensure your `.env` file is not committed with secrets in public repos.
- For other platforms (e.g., Netlify, AWS), use the Dockerfile or adapt the build/start scripts as needed.
