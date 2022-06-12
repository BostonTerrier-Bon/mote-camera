import { useState, useEffect, useRef, RefObject } from "react";
import * as faceapi from '@vladmandic/face-api';
import { MoteCamAdviceType, MoteCamAdviceMessage } from "../component/MoteCamMessage";
import { speakMessage } from "../hooks/useSpeech";


function str(json: any) {
    let text = '<font color="lightblue">';
    text += json ? JSON.stringify(json).replace(/{|}|"|\[|\]/g, '').replace(/,/g, ', ') : '';
    text += '</font>';
    return text;
}

function log(...txt: any[]) {
    console.log(...txt);
}

const MODEL_PATH = '/model'
const detectorOptions = new faceapi.TinyFaceDetectorOptions();

type MoteCamType = {
    isStarted: boolean,
    startAndStop: () => void,
    isReady: boolean,
    isTakenPhoto: boolean,
    dismissTakenPhoto: () => void,
    downloadPhoto: () => void,
    moteCamAdvice: MoteCamAdviceType,
    videoRef: RefObject<HTMLVideoElement>,
    canvasRef: RefObject<HTMLCanvasElement>,
    photoRef: RefObject<HTMLImageElement>,
}

const useMOTECam = (): MoteCamType => {

    const [ isStarted, setIsStarted ] = useState<boolean>(false)
    const [ isReady, setIsReady ] = useState<boolean>(false)
    const [ isTakenPhoto, setIsTakenPhoto ] = useState<boolean>(false)
    const [ moteCamAdvice, setMoteCamAdvice ] = useState<MoteCamAdviceType>({expression:{message:"",fulfilled:false},age:{message:"",fulfilled:false},faceSize:{message:"",fulfilled:false},facePosition:{message:"",fulfilled:false}})
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const photoRef = useRef<HTMLImageElement>(null)


    const startMoteCam = async () => {


        if( isStarted ){
            stopMoteCam()
            speakMessage('撮影を終了します')
            return
        }
        speakMessage('撮影を開始します')

        setIsStarted(true)
        // TensorFlow
        await setupTensorFlow()
        // FaceAPI
        await setupModel()
        // Camera
        await setupCamera()
        setIsReady(true)        
    }
    
    const stopMoteCam = () => {
        toggleStartStop()
        setIsStarted(false)
        setIsReady(false)
    }

    const dismissTakenPhoto = () => {
        setIsTakenPhoto(false)
        toggleStartStop()
    }


    // SetUp Tensolflow
    const setupTensorFlow = async () => {
        // @ts-ignore
        await faceapi.tf.setBackend('webgl');
        // @ts-ignore
        await faceapi.tf.enableProdMode();
        // @ts-ignore
        await faceapi.tf.ENV.set('DEBUG', false);
        // @ts-ignore
        await faceapi.tf.ready();

        // log(`Version: FaceAPI ${str(faceapi?.version || '(not loaded)')} TensorFlow/JS ${str(faceapi?.tf?.version_core || '(not loaded)')} Backend: ${str(faceapi?.tf?.getBackend() || '(not loaded)')}`);
    }

    // Setup Model
    const setupModel = async () => {

        await faceapi.nets.tinyFaceDetector.load(MODEL_PATH); // using ssdMobilenetv1
        await faceapi.nets.ageGenderNet.load(MODEL_PATH);
        await faceapi.nets.faceLandmark68Net.load(MODEL_PATH);
        await faceapi.nets.faceRecognitionNet.load(MODEL_PATH);
        await faceapi.nets.faceExpressionNet.load(MODEL_PATH);
      
        // check tf engine state
        // @ts-ignore
        log(`Models loaded: ${str(faceapi.tf.engine().state.numTensors)} tensors`);
    }

    // Setup Camera
    const setupCamera = async () => {
        if( videoRef.current && canvasRef.current ){
            const video = videoRef.current as HTMLVideoElement
            const canvas = canvasRef.current as HTMLCanvasElement
            if (!navigator.mediaDevices) {
                throw new Error("Camera Error: access not supported");                
            }
            const constraints = {
                audio: false,
                video: true,
                // audio: false,
                // video: {
                //     facingMode: 'user',
                //     width: {
                //         ideal: 1280,
                //     },
                //     height: {
                //         ideal: 1280,
                //     },
                // },

                // advanced : [
                //     { 
                //         brightness: 10,
                //         // contrast: 100,
                //     }
                // ]
            };
            let stream: MediaStream
            try {
                stream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (err: any) {
                let msg = ''
                if (err.name === 'PermissionDeniedError' || err.name === 'NotAllowedError'){
                    msg = 'camera permission denied';
                }else if(err.name === 'SourceUnavailableError'){
                    msg = 'camera not available';
                }
                throw new Error(`Camera Error: ${msg}: ${err.message || err}`);                
            }
            if( stream ){
                video.srcObject = stream
            }else{
                throw new Error("Camera Error: MediaStream Empty");
            }
            const track = stream.getVideoTracks()[0];
            // 明るさ調整できるか？
            console.log('******* Brightness Check');
            // const supported = navigator.mediaDevices.getSupportedConstraints();
            // console.log(supported);
            console.log(track.getCapabilities());            
            // settings.brightness = 0.1
            // constraint.brightness = {exact: 100}
            // track.applyConstraints(constraint)
            // track.applyConstraints({ advanced : [{ zoom: 100 }] });
            // track.applyConstraints({ advanced : [{ brightness: 60, contrast: 70 }] });
            // ********
            track.applyConstraints(
                {
                    audio: false,
                video: {
                    facingMode: 'user',
                    width: {
                        // ideal: 1280,
                        ideal: 2778,
                    },
                    height: {
                        // ideal: 1280,
                        ideal: 2778,
                    },
                },
                // @ts-ignore
                advanced : [{ brightness: 50, contrast: 50 }]
            });
            // ********

            // console.log(applied);
            const constraint = track.getConstraints()
            console.log(constraint);
            console.log('Brightness Check *************');            
            //
            const settings = track.getSettings();
            if (settings.deviceId){
                // プロパティ削除、間接的なメモリ開放
                delete settings.deviceId;
            }
            if (settings.groupId){
                delete settings.groupId;
            }
            if (settings.aspectRatio){
              console.log(`settings.aspectRatio >> ${settings.aspectRatio}`);             
              settings.aspectRatio = Math.trunc(100 * settings.aspectRatio) / 100;
              // settings.aspectRatio = 1.0;
            }
            // videoサイズでcanvasを設定
            canvas.width = settings.width ? settings.width : 0
            canvas.height = settings.height ? settings.height : 0
            canvas.style.width = "100%"     
            canvas.style.height = "100%"     
            log(`Camera active: ${track.label}`); // ${str(constraints)}
            log(`Camera settings: ${str(settings)}`);
          
            video.onloadeddata = async () => {
                video.play();
                // 反転
                const ctx = canvas.getContext('2d');
                ctx?.scale(-1,1);
                ctx?.translate(-canvas.width, 0);          
                await detectHandler()
            };
        }


    }

    // Face Detection
    const detectHandler = async () => {
        if( videoRef.current ){
            const video = videoRef.current as HTMLVideoElement
            if( !video.paused ){
                const t0 = performance.now();
                console.log(`Detect Video W: ${video.width}`);
                console.log(`Detect Video H: ${video.height}`);
                const detectedFace = await faceapi
                                        .detectSingleFace(video, detectorOptions)
                                        .withFaceLandmarks()
                                        .withFaceExpressions()
                                        .withAgeAndGender()
                const fps = 1000 / (performance.now() - t0);
                console.log('Did Detect Video');
                drawFace(detectedFace, fps.toLocaleString());
                // Check Detected Face
                checkFace(detectedFace)

                // 渡した関数が最適なタイミングで処理されるHack
                // https://blog.leap-in.com/use-requestanimtionframe/
                requestAnimationFrame(
                    () => detectHandler()
                );
            }
        }
    }

    // Draw
    const drawFace = (face: any, fps: string ) => {
        if( canvasRef.current && face ){
            const canvas = canvasRef.current as HTMLCanvasElement
            const ctx = canvas.getContext('2d');
            if( ctx ){
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.font = 'small-caps 20px "Segoe UI"';
                ctx.fillStyle = 'white';
                ctx.fillText(`FPS: ${fps}`, 10, 25);          
                console.log('Detect Face');  
                console.log(face);
    
                // if( face === undefined ) return;
    
                // Drawing Frames
                ctx.lineWidth = 3;
                ctx.strokeStyle = 'deepskyblue';
                ctx.fillStyle = 'deepskyblue';
                ctx.globalAlpha = 0.6;
                ctx.beginPath();
                ctx.rect(face.detection.box.x, face.detection.box.y, face.detection.box.width, face.detection.box.height);
                ctx.stroke();
                ctx.globalAlpha = 1;
                // const expression = face.expressions.sort((a, b) => Object.values(a)[0] - Object.values(b)[0]);
                // const expression = Object.entries(face.expressions).sort((a, b) => b[1] - a[1]);
                const expression: any = Object.entries(face.expressions).sort((a:any, b:any) => b[1] - a[1]);
            
                ctx.fillStyle = 'black';
                ctx.fillText(`gender: ${Math.round(100 * face.genderProbability)}% ${face.gender}`, face.detection.box.x, face.detection.box.y - 59);
                // ctx.fillText(`expression: ${Math.round(100 * expression[0][1])}% ${expression[0][0]}`, face.detection.box.x, face.detection.box.y - 41);
                ctx.fillText(`expression: ${Math.round(100 * expression[0][1])}% ${expression[0][0]}`, face.detection.box.x, face.detection.box.y - 41);
                ctx.fillText(`age: ${Math.round(face.age)} years`, face.detection.box.x, face.detection.box.y - 23);
                ctx.fillText(`roll:${face.angle.roll.toFixed(3)} pitch:${face.angle.pitch.toFixed(3)} yaw:${face.angle.yaw.toFixed(3)}`, face.detection.box.x, face.detection.box.y - 5);
                ctx.fillStyle = 'lightblue';
                ctx.fillText(`gender: ${Math.round(100 * face.genderProbability)}% ${face.gender}`, face.detection.box.x, face.detection.box.y - 60);
                ctx.fillText(`expression: ${Math.round(100 * expression[0][1])}% ${expression[0][0]}`, face.detection.box.x, face.detection.box.y - 42);
                ctx.fillText(`age: ${Math.round(face.age)} years`, face.detection.box.x, face.detection.box.y - 24);
                ctx.fillText(`roll:${face.angle.roll.toFixed(3)} pitch:${face.angle.pitch.toFixed(3)} yaw:${face.angle.yaw.toFixed(3)}`, face.detection.box.x, face.detection.box.y - 6);
                // draw face points for each face
                ctx.globalAlpha = 0.8;
                ctx.fillStyle = 'lightblue';
    
                // Aim
                ctx.beginPath();
                const rectW = 400
                const rectH = 400
                ctx.rect((canvas.width - rectW)/2, (canvas.height - rectH)/2, rectW, rectH);
                ctx.stroke();
            }


        }

    }

    // Checking MOTE Face
    const checkFace = (face: any) => {
        if( face && canvasRef.current ){
            const canvas = canvasRef.current as HTMLCanvasElement

            // // 顔が真ん中にきてるか？
            const facePosition = checkCenterFacing(
                {w:canvas.width, h:canvas.height},
                face.detection.box
            )

            // 顔のサイズはちょうどよいか？
            const faceSize = checkFaceSize(
                {w:canvas.width, h:canvas.height},
                face.detection.box
            )

            // 表情は？
            const faceExp = checkGoodExpression( face.expressions)

            // 年齢
            const faceAgeMsg = expectedAgeMessage( face.age )

            setMoteCamAdvice({
                expression:faceExp,
                age:faceAgeMsg,
                faceSize:faceSize,
                facePosition:facePosition,
            })

            if( facePosition.fulfilled && faceSize.fulfilled && faceExp.fulfilled ){
                // Enough to Shot
                console.log('Shot Photo');
                setIsTakenPhoto(true)
                speakMessage('モッテモテ写真が撮影出来ました')
                takePhoto()            
            }
        }
    }

    // 顔がだいたい真ん中にあるか？
    const checkCenterFacing = (frame: {w: number, h: number}, facebox: {x: number, y: number, width: number, height: number}): MoteCamAdviceMessage => {

        // frameの中心
        const frameCenter:{x: number, y: number} = {x: frame.w/2, y: frame.h/2}
        // あそび
        const cordinator:{w: number, h: number} = { w: 200, h: 200 }
    
        // 許容される上下左右
        const toleranceRange: {
            left: number,
            right: number,
            top: number,
            bottom: number,  
        } = {
            left: frameCenter.x - cordinator.w,
            right: frameCenter.x + cordinator.w,
            top: frameCenter.y - cordinator.h,
            bottom: frameCenter.y + cordinator.h,
        }
    
        // 顔の中心
        const faceCenter:{x: number, y: number} = {
            x: facebox.x + (facebox.width/2),
            y: facebox.y + (facebox.height/2)
        }
        
        // 範囲内にあるか判定する
        // 横方向
        let horizontal = false
        if( toleranceRange.left < faceCenter.x 
        && faceCenter.x < toleranceRange.right ){
    
            horizontal = true
        }
        let vertical = false
        if( toleranceRange.top < faceCenter.y
        && faceCenter.y < toleranceRange.bottom ){
    
            vertical = true
        }
    
        const isJust = (horizontal && vertical)
        const isTooUpper = (faceCenter.y < toleranceRange.top)
        const isTooDown = (faceCenter.y > toleranceRange.bottom)
        const isTooRight = (faceCenter.x > toleranceRange.right)
        const isTooLeft = (faceCenter.x < toleranceRange.left)
    
        // const msgBox = document.getElementById('face_position');
        let msg = ''
        if( isJust ){
            msg = 'ちょうど良いです😀'
        }
    
        if( isTooUpper ){
            msg = 'もう少しシタですね'  
        }else if( isTooDown ){
            msg = 'もう少しウエですね'
        }
    
        // Canvas左右反転させているので逆
        if( isTooRight ){
            msg = 'もう少し右ですね'
        }else if( isTooLeft ){
            msg = 'もう少し左ですね'
        }
    
        return {
            fulfilled: (horizontal && vertical),
            message: msg
        }

    }
    
    // 顔の大きさ
    const checkFaceSize = (frame: {w: number, h: number}, facebox: {x: number, y: number, width: number, height: number} ): MoteCamAdviceMessage => {
        // Frame を占める割合で判定する
        const frameArea = frame.w * frame.h
        const faceArea = facebox.width * facebox.height
    
        // 30% to 50%
        const lowRatio = 0.2
        const highRatio = 0.3
        const ratio = faceArea / frameArea
        console.log(`Face Area Ratio: ${ratio}`);
        
    
        let isSufficient = (lowRatio <= ratio && ratio <= highRatio)
        let tooSmall = (lowRatio > ratio)
        let tooBig = (ratio > highRatio)
        // console.log(`小さすぎないか？: ${lowRatio <= ratio}`);
        // console.log(`大きすぎないか？: ${ratio <= highRatio}`);
        let msg = ""
        if( isSufficient ){
            msg = `ちょうど良い顔の大きさです🙆: ${Math.floor(ratio*100)}%`
        }else if( tooSmall ){
            // msg = `顔が小さすぎます。もう少しカメラに近づきましょう: ${Math.floor(ratio*100)}%`
            msg = `顔が小さすぎます。もう少しカメラに近づきましょう`
        }else if( tooBig ){
            // msg = `顔が大きすぎます。もう少しカメラから離れましょう: ${Math.floor(ratio*100)}%`
            msg = `顔が大きすぎます。もう少しカメラから離れましょう`
        }else{
            msg = `？？: ${Math.floor(ratio*100)}%`
        }

        return {
            fulfilled: isSufficient,
            message: msg
        }
    }
    
    // 表情と年齢
    type FaceExp = {
        expression: string;
        predict: number;
    }
    // 表情
    // angry: 0.0001337282155873254
    // disgusted: 3.1885437579148856e-7
    // fearful: 1.3430851986129255e-9
    // happy: 0.000003975554136559367
    // neutral: 0.99961256980896
    // sad: 0.00024136707361321896
    // surprised: 0.000008040878128667828
    const checkGoodExpression = ( expression: any ): MoteCamAdviceMessage => {
    
        const faceExps: FaceExp[] = []
        for (const key in expression) {
        const faceExp: FaceExp = {
            expression: key,
            predict: expression[key]
        }
        faceExps.push(faceExp)
        }
        // console.log(faceExps);
        const sorted = faceExps.sort( (prev, current) => {
        return (prev.predict > current.predict) ? -1 : 1
        })
        // console.log(sorted);
        let isGood = false
        let expMsg = ""
        switch (sorted[0].expression) {
        case "happy":
            expMsg = '良い表情です👍'
            isGood = true
            break;
        case "neutral":
            // expMsg = '表情が少し固いですね😥'
            expMsg = '表情がちょっとかたいです'
            break;  
        default:
            // expMsg = 'もっとリラックス😊'
            expMsg = 'もっとリラックスしてください'
            break;
        }
        console.log(expMsg);
    
        return {
            fulfilled: isGood,
            message: expMsg
        }
    }

    // 年齢
    const expectedAgeMessage = ( age: number ): MoteCamAdviceMessage => {
        const ageMsg = `${Math.round(age)}歳くらいに見えますよ`
        console.log(ageMsg);
        return {
            fulfilled: true,
            message: ageMsg
        }
    }

    
    // 撮影実行
    const takePhoto = () => {

        if( videoRef.current && photoRef.current ){
            const video = videoRef.current as HTMLVideoElement
            const photo = photoRef.current as HTMLImageElement
            const canvasForDraw = document.createElement('canvas') as HTMLCanvasElement

            //
            const stream: MediaStream = video.srcObject as MediaStream
            if( stream === null ) return
        
            const track = stream.getVideoTracks()[0];
            const settings = track.getSettings();
            const width = settings.width ? settings.width : 0
            const height = settings.height ? settings.height : 0  
        
            canvasForDraw.width = width
            canvasForDraw.height = height

            const ctx: CanvasRenderingContext2D = canvasForDraw.getContext('2d')!
    
            // 反転
            ctx.scale(-1,1);
            ctx.translate(-width, 0);
        
            ctx.drawImage(video, 0, 0, width, height);
            photo.src = canvasForDraw.toDataURL('image/png');
        
            video.pause()        
        }
    }    

    // Download Photo
    const downloadPhoto = () => {
        if( photoRef.current ){
            const a = document.createElement("a");      
            const photo = photoRef.current as HTMLImageElement
            document.body.appendChild(a);
            a.download = 'best_shot.png';
            a.href = photo.src;          
            a.click();
            a.remove();
        }
    }    

    // Restart
    const toggleStartStop = () => {

        if( videoRef.current ){
            const video = videoRef.current as HTMLVideoElement
            if (video && video.readyState >= 2) {
                // @ts-ignore
                if (video.paused) {
                    // @ts-ignore
                    video.play();
                    setTimeout( () => {
                        detectHandler()
                    }, 1000 )
                } else {
                    // @ts-ignore
                    video.pause();
                }
            }
            // @ts-ignore
            log(`Camera state: ${video.paused ? 'paused' : 'playing'}`);
        }
    }

    return {
        isStarted: isStarted,
        startAndStop: startMoteCam,
        isReady: isReady,
        isTakenPhoto: isTakenPhoto,
        dismissTakenPhoto: dismissTakenPhoto,
        downloadPhoto: downloadPhoto,
        moteCamAdvice: moteCamAdvice,
        videoRef: videoRef,
        canvasRef: canvasRef,
        photoRef: photoRef,
    }
}

export { useMOTECam }
