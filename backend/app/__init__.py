import os
import traceback
from flask import Flask
from flask_restful import Api
from flask_cors import CORS
from app.routes import init_routes
from app.utils.config import MONGO_URI, CORS_HEADERS

def create_app():
    app = Flask(__name__)
    api = Api(app)
    CORS(app)
    app.config["MONGO_URI"] = MONGO_URI
    app.config["CORS_HEADERS"] = CORS_HEADERS

    init_routes(api)
    
    # error handler
    @app.errorhandler(Exception)
    def handle_error(e):
        print(f"Error: {traceback.format_exc()}")
        return {"error": str(e)}, 500
    
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=os.environ.get("LISTEN_PORT", 5000))
