import './App.css';
import React, { useState, useEffect } from "react";
import {useJsApiLoader, GoogleMap, MarkerF} from "@react-google-maps/api";
import { ChakraProvider, Box, IconButton, Flex, Link, VStack } from "@chakra-ui/react";
import { FaLocationArrow, FaInstagram } from 'react-icons/fa';
import { BiDonateHeart } from 'react-icons/bi';

function App() {

  const {isLoaded} = useJsApiLoader({ googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY})
  const [map, setMap] = useState(/**@type google.maps.Map*/ (null))
  const [latitude, setLatitude] = useState(null)
  const [longitude, setLongitude] = useState(null)
  const center = { lat:54.00, lng: -3.00 }
  const google = window.google;

  // Fetch the latest location from the back-end
  useEffect(() => {
    const fetchData = async () => {
        try {
            const response = await fetch("/current-location");
            const json = await response.json();
            setLatitude(json.latitude);
            setLongitude(json.longitude);
        } catch (error) {
            console.log(error);
        }
    };

    fetchData();
  }, []);

  //Display a loading message if the map hasn't loaded yet
  if (!isLoaded) {
    return <div>{'Loading...'}</div>
  }
  
  return(
    <ChakraProvider>
      <Flex
      position='relative'
      flexDirection='row'
      alignItems='center'
      w='100vw'
      h='100vh'
      >
        <Box position='absolute' left={0} top={0} h='100%' w='100%'>
          <GoogleMap 
            center={center}
            zoom={5.7}
            mapContainerStyle={{width:'100%', height:'100%'}}
            onLoad={(map) => setMap(map)}
            options={{
              fullscreenControl: false, 
              scaleControl: true
            }}
          >
            <MarkerF
              position={{ lat:parseFloat(latitude), lng: parseFloat(longitude) }}
              icon= {{
                url: require('./resources/marker_image.png'),
                scaledSize: new google.maps.Size(37, 37)
              }}
            >
            </MarkerF>
          </GoogleMap>
        </Box>
        <VStack
          position={'absolute'}
          top={'1%'}
          right={'1%'}
        >
          <IconButton
              aria-label='center back'
              icon={<FaLocationArrow /> }
              isRound
              size={'lg'}
              onClick={() => {
                map.panTo({ lat:parseFloat(latitude), lng: parseFloat(longitude) })
                map.setZoom(9.75)
              }}
          />
          <Link href={process.env.REACT_APP_JUST_GIVING} isExternal>
            <IconButton
              aria-label='donate'
              icon={<BiDonateHeart /> }
              colorScheme='teal'
              isRound
              size={'lg'}
            />
          </Link>
          <Link href={process.env.REACT_APP_INSTAGRAM} isExternal>
            <IconButton
              aria-label='instagram'
              icon={<FaInstagram /> }
              colorScheme='pink'
              isRound
              size={'lg'}
            />
          </Link>
        </VStack>
      </Flex>
    </ChakraProvider>
  )
}

export default App;