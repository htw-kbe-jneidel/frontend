import { Router } from "express";
import axios from "axios";
const router = Router();

const baseUrl = "http://localhost:8000/api";
async function get( path: string ) {
  return axios.get( `${baseUrl}${path}` ).then( res => res.data );
}
async function post( path: string, data: any ) {
  return axios.post( `${baseUrl}${path}`, data ).then( res => res.data );
}

router.get( "/", ( req, res ) => {
  return res.render( "landing" );
} );

router.get( "/product/:id", async ( req: any, res ) => {
  const productId = req.params.id;

  const [ product, storeLocations ] = await Promise.all( [
    get( `/product?productId=${productId}` ).then( d => d.product ),
    get( `/storeLocations` ),
  ] );

  const [ vat, amount1, amount2  ] = await Promise.all( [
    post( `/caculateVat`, {
      price   : product.price,
      category: product.category,
    } ).then( d => d.vat ),
    get( `/productQuantityAtLocation?productId=${productId}&storeLocationId=${storeLocations[0].storeLocationId}` ).then( d => d.amount ),
    get( `/productQuantityAtLocation?productId=${productId}&storeLocationId=${storeLocations[1].storeLocationId}` ).then( d => d.amount ),
  ] );

  storeLocations[0].amount = amount1;
  storeLocations[1].amount = amount2;

  const unavailable = [ null, null ];
  if ( amount1 === 0 && amount2 !== 0 )
    unavailable[0] = await post( `/calculateDistance`, [ storeLocations[0].coordinates, storeLocations[1].coordinates ] );
  else if ( amount2 === 0 && amount1 !== 0 )
    unavailable[1] = await post( `/calculateDistance`, [ storeLocations[1].coordinates, storeLocations[0].coordinates ] );


  return res.render( "product", { product, vat: ( product.price - vat ).toFixed( 2 ), storeLocations, unavailable } );
} );

router.get( "/products", async ( req: any, res ) => {
  const products = await get( `/products` );

  return res.render( "products", { products } );
} );

router.get( "/storeLocation/:id", async ( req: any, res ) => {
  const storeLocationId = req.params.id;

  const [ storeLocation, products, quantitiesAtLocations ] = await Promise.all( [
    get( `/storeLocation?storeLocationId=${storeLocationId}` ).then( d => d.storeLocation ),
    get( `/products` ),
    get( `/productQuantitiesAtLocations` ),
  ] );

  const productObject = products.reduce( ( acc, cur ) => {
    acc[cur.productId] = cur;
    return acc;
  }, {} );

  const productQuantities = quantitiesAtLocations
    .filter( x => x.storeLocationId == storeLocationId )
    .filter( x => x.amount > 0 )
    .map( x => {
      const obj = productObject[x.productId];
      obj.amount = x.amount;
      return obj;
    } );

  return res.render( "storeLocation", { store: storeLocation, products: productQuantities } );
} );

router.get( "/storeLocations", async ( req: any, res ) => {
  const storeLocations = await get( `/storeLocations` );

  return res.render( "storeLocations", { storeLocations } );
} );

export default router;
