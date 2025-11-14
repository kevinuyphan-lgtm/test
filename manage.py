from flask.cli import FlaskGroup
from app import create_app, db

def create_my_app():
    return create_app()

cli = FlaskGroup(create_app=create_my_app)

if __name__ == "__main__":
    cli()
