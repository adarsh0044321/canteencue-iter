import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'vite-plugin-local-gemini-proxy',
        configureServer(server) {
          server.middlewares.use('/gemini', async (req, res) => {
            if (req.method === 'OPTIONS') {
              res.writeHead(204, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-gemini-api-key',
              })
              return res.end()
            }

            if (req.method !== 'POST') {
              res.writeHead(405, { 'Content-Type': 'application/json' })
              return res.end(JSON.stringify({ error: { message: 'Method Not Allowed' } }))
            }

            let body = ''
            req.on('data', (chunk) => (body += chunk))
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body || '{}')
                const customKey = req.headers['x-gemini-api-key'] || parsed.customApiKey || parsed.apiKey
                const apiKey = (env.GEMINI_API_KEY || customKey || '').trim()

                if (!apiKey) {
                  res.writeHead(500, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                  })
                  return res.end(
                    JSON.stringify({
                      error: { message: 'GEMINI_API_KEY is not configured in .env' },
                    })
                  )
                }

                const model = parsed.model || 'gemini-flash-latest'
                const payload = parsed.contents
                  ? parsed
                  : {
                      contents: [{ parts: [{ text: String(parsed.prompt || '') }] }],
                    }

                const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
                  model
                )}:generateContent?key=${encodeURIComponent(apiKey)}`

                const googleRes = await fetch(googleUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                })

                const data = await googleRes.json()
                res.writeHead(googleRes.status, {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                })
                res.end(JSON.stringify(data))
              } catch (e: any) {
                res.writeHead(500, {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                })
                res.end(JSON.stringify({ error: { message: e.message } }))
              }
            })
          })
        },
      },
    ],
    server: {
      port: 3000,
      host: true,
    },
    preview: {
      port: 3000,
      host: true,
    },
  }
})
