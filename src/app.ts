import { configureExpress } from "./service";

const HTTP_PORT = 8002;

const app = configureExpress();

import routes from "./routes";
app.use( "/", routes );

app.use( "/", ( req, res: any ) => {
  return res.status( 404 ).json( { error: true, errorMsg: "Not found" } );
} );
app.use( "/:anything", ( req, res: any ) => {
  return res.status( 404 ).json( { error: true, errorMsg: "Not found" } );
} );

app.listen( HTTP_PORT, () => console.log( `frontend running on: http://localhost:${  HTTP_PORT}` ) );
