import { 
    Box,
    Text,
    VStack,
    HStack,
} from '@chakra-ui/react'
import {useSpeech} from "../hooks/useSpeech";


export type MoteCamAdviceMessage = {
    message: string
    fulfilled: boolean
}

export type MoteCamAdviceType = {
    expression: MoteCamAdviceMessage
    age: MoteCamAdviceMessage
    faceSize: MoteCamAdviceMessage
    facePosition: MoteCamAdviceMessage
}


const MoteCamMessage = ( { 
    expression,
    age,
    faceSize,
    facePosition,
 }: MoteCamAdviceType ) => {

    // const speakAdvice = useSpeech()

    // console.log(expression);
    
    // speakAdvice(expression)
    
    useSpeech(
        [expression,
        // age,
        faceSize,
        facePosition])

    return (
        <Box my={8}>
            <VStack>
                <HStack>
                    {/* <Text>表情</Text> */}
                    <Text>{expression.message}</Text>
                </HStack>
                <HStack>
                    {/* <Text>年齢</Text> */}
                    <Text>{age.message}</Text>
                </HStack>
                <HStack>
                    {/* <Text>顔の大きさ</Text> */}
                    <Text>{faceSize.message}</Text>
                </HStack>
                <HStack>
                    {/* <Text>顔の位置</Text> */}
                    <Text>{facePosition.message}</Text>
                </HStack>              
            </VStack>
        </Box>
    )
}

export { MoteCamMessage }