import { useEffect } from "react";
import { MoteCamAdviceMessage } from "../component/MoteCamMessage";


const useSpeech = ( messages: MoteCamAdviceMessage[] ) => {

    // console.log(messages);

    // const [previousMessage, setPreviousMessage ] = useState<string>("")

    useEffect( () => {

      // console.log(messages);
      const candidates = messages.filter( msg => {
        return !msg.fulfilled
      })
      // console.log(candidates);      
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
            // 
            // utterance.addEventListener('start', () => {
            //     const main = document.getElementsByTagName('main')[0];
            //     main.classList.add('speaking');
            // });
            // utterance.addEventListener('end', () => {
            //   const main = document.getElementsByTagName('main')[0];

            //   main.addEventListener(
            //     'animationiteration',
            //     () => main.classList.remove('speaking'),
            //     { once: true }
            //   );
            // });
            //
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