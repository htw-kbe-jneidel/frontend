import express from "express";
import bodyParser from "body-parser";
import helmet from "helmet";
import path from "path";

class ExpressConfiguration {
  private app: any;

  constructor() {
    this.app = express();
  }

  configureExpress() {
    this.configureSecurity();
    this.configureViewEngine();
    this.configureBodyParsing();

    return this.app;
  }

  private configureSecurity() {
    this.app.use( helmet( { referrerPolicy: true } ) );
  }

  private configureViewEngine() {
    this.app.set( "view engine", "pug" );
    this.app.set( "views", path.resolve( __dirname, "../../src/view" ) );
    this.app.use( express.static( path.resolve( __dirname, "../../src/static" ) ) );
  }

  private configureBodyParsing() {
    this.app.use( bodyParser.json() );
    this.app.use( bodyParser.urlencoded( { extended: true } ) );
  }
}

const expressConfiguration = new ExpressConfiguration();
export const configureExpress = () => expressConfiguration.configureExpress.apply( expressConfiguration );
