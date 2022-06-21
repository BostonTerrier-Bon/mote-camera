import { DetectSingleFaceTask } from '@vladmandic/face-api/src/globalApi/DetectFacesTasks';

export const showDebuggingRect = (face: DetectSingleFaceTask, fps: string, canvas: HTMLCanvasElement) => {
    if( face && canvas ){
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
            const expression: any = Object.entries(face.expressions).sort((a:any, b:any) => b[1] - a[1]);
        
            ctx.fillStyle = 'black';
            ctx.fillText(`gender: ${Math.round(100 * face.genderProbability)}% ${face.gender}`, face.detection.box.x, face.detection.box.y - 59);
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