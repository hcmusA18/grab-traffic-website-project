import os
from app import create_app

app = create_app()
app.run(debug=True, host="0.0.0.0", port=os.environ.get("LISTEN_PORT", 5000))
