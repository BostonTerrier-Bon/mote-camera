import type { NextPage } from 'next'
import { 
  Box,
  Heading,
} from '@chakra-ui/react'
import { MoteCamComponent } from "../components/MoteCamComponent";

const Index: NextPage = () => {
  return (
    <Box mx={'auto'} as='main' maxWidth={'420px'}>
      <Heading h={"40px"} my={4} w='100%' textAlign='center'>
        Mote Camera
      </Heading>
      <Box>
        <MoteCamComponent />
      </Box>
    </Box>   
  )
}

export default Index
