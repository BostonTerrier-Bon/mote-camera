import { useEffect } from "react";
import { MoteCamAdviceMessage } from "../component/MoteCamMessage";


const useSpeech = ( messages: MoteCamAdviceMessage[] ) => {


    useEffect( () => {

      const candidates = messages.filter( msg => {
        return !msg.fulfilled
      })
      if( candidates.length > 0 ){
        const message = selectMessage( candidates )
        console.log(`Selected Message: ${message}`);
        if( message ){
          speakAdvice( message )
        }
      } 
    }, [messages])

    const selectMessage = ( msgs: MoteCamAdviceMessage[] ): string => {
      const idx = Math.floor( Math.random() * msgs.length )
      return msgs[idx].message
    }


    const speakAdvice = ( message: string ) => {
        if( message !== 'undefined' && typeof speechSynthesis !== 'undefined' 
            && speechSynthesis.speaking === false ){

            speechSynthesis.cancel();//chromeバグ用  
            const utterance = new SpeechSynthesisUtterance();
            utterance.text = message;
            utterance.lang = 'ja-JP';
            speechSynthesis.speak(utterance)
        }  
    }
}

const speakMessage = ( message: string ) => {
  speechSynthesis.cancel();//chromeバグ用  
  const utterance = new SpeechSynthesisUtterance();
  utterance.text = message;
  utterance.lang = 'ja-JP';
  speechSynthesis.speak(utterance)
}


export { useSpeech, speakMessage}