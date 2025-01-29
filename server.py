# -*- coding: utf-8 -*-
from http.server import HTTPServer, SimpleHTTPRequestHandler
import os
import json

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

def generate_files_json():
    data_dir = os.path.join(os.path.dirname(__file__), 'data')
    try:
        csv_files = [f for f in os.listdir(data_dir) if f.endswith('.csv')]
        with open(os.path.join(data_dir, 'files.json'), 'w', encoding='utf-8') as f:
            json.dump(csv_files, f, indent=4)
        print("files.json has been updated.")
    except Exception as e:
        print(f"Error generating files.json: {e}")

# Create the server
def run_server():
    generate_files_json()
    httpd = HTTPServer(("", PORT), CustomHandler)
    print(f"Serving at port {PORT}")
    httpd.serve_forever()

if __name__ == "__main__":
    run_server()
