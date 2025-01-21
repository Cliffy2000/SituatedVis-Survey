# -*- coding: utf-8 -*-
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = 8000

# Extend the MIME types map
class CustomHandler(SimpleHTTPRequestHandler):
    extensions_map = {
        '.manifest': 'text/cache-manifest',
        '.html': 'text/html',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.svg': 'image/svg+xml',
        '.css': 'text/css',
        '.js': 'application/javascript',  # Correct MIME type for JS
        '': 'application/octet-stream',   # Default MIME type
    }

# Create the server
def run_server():
    httpd = HTTPServer(("", PORT), CustomHandler)
    print(f"Serving at port {PORT}")
    httpd.serve_forever()

if __name__ == "__main__":
    run_server()
