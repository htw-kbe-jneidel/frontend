import { Router } from "express";
import axios from "axios";
const router = Router();

const baseUrl = "http://localhost:8000/api";

router.get( "/", ( req: any, res ) => {
  return res.render( "landing" );
} );

router.get( "/product/:id", async ( req: any, res ) => {
  const productId = req.params.id;
  const product = await axios.get( `${baseUrl  }/product?productId=${  productId}` )
    .then( res => res.data.product );

  const vat = await axios.post( `${baseUrl  }/caculateVat`, {
    price: product.price, category: product.category,
  } )
    .then( res => res.data.vat );

  const storeLocations = await axios.get( `${baseUrl  }/storeLocations` )
    .then( res => res.data );

  const amounts = await Promise.all( [
    axios.get( `${baseUrl}/productQuantityAtLocation?productId=${productId}&storeLocationId=${storeLocations[0].storeLocationId}` ).then( res => res.data.amount ),
    axios.get( `${baseUrl}/productQuantityAtLocation?productId=${productId}&storeLocationId=${storeLocations[1].storeLocationId}` ).then( res => res.data.amount ),
  ] );

  storeLocations[0].amount = amounts[0];
  storeLocations[1].amount = amounts[1];

  const unavailable = [ null, null ];
  if ( amounts[0] === 0 && amounts[1] !== 0 ) {
    const distance = await axios.post( `${baseUrl  }/calculateDistance`, [
      storeLocations[0].coordinates, storeLocations[1].coordinates,
    ] )
      .then( res => res.data );
    unavailable[0] = distance;
  } else if ( amounts[1] === 0 && amounts[0] !== 0 ) {
    const distance = await axios.post( `${baseUrl  }/calculateDistance`, [
      storeLocations[1].coordinates, storeLocations[0].coordinates,
    ] )
      .then( res => res.data );
    unavailable[1] = distance;
  }

  return res.render( "product", { product, vat: ( product.price - vat ).toFixed( 2 ), storeLocations, unavailable } );
} );

router.get( "/products", async ( req: any, res ) => {
  const products = await axios.get( `${baseUrl  }/products` )
    .then( res => res.data );

  return res.render( "products", { products } );
} );

router.get( "/storeLocation/:id", async ( req: any, res ) => {
  const storeLocationId = req.params.id;

  const [ storeLocation, products, quantitiesAtLocations ] = await Promise.all( [
    axios.get( `${baseUrl  }/storeLocation?storeLocationId=${  storeLocationId}` )
      .then( res => res.data.storeLocation ),
    axios.get( `${baseUrl  }/products` ).then( res => res.data ),
    axios.get( `${baseUrl}/productQuantitiesAtLocations` )
      .then( res => res.data ),
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
  const storeLocations = await axios.get( `${baseUrl  }/storeLocations` )
    .then( res => res.data );

  return res.render( "storeLocations", { storeLocations } );
} );

export default router;
