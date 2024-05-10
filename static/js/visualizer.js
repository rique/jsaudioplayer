(function(window, document, JSPlayer, undefined) {
    const getFormatedDate = JSPlayer.Utils.getFormatedDate;

    const draw = (c, d, i, analyserNode, dataArray,  bufferLength, canvasCtx, canvas, background, imgList) => {

        if (d)
            c += 1;
        else
            c -= 1;
        if (c >= 2328)
            d = false;
        else if (c == 0) {
            d = true;
            curImg = encodeURI(`${imgList[i]}`);
            background.src = `http://jsradio.me:3600/${curImg}`;
            ++i;
            if (i >= imgList.length)
                i = 0;
        }
        

        //Get spectrum data
        analyserNode.getFloatFrequencyData(dataArray);

        //Draw black background
        canvasCtx.fillStyle = "#181717";
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        
        let width, height, x, y = 0;
        // let coef = (canvas.width / background.width) * .8;
        let coef = (canvas.height / background.height) * (1.05 + (c / 3008));
        width =  background.width * coef;
        height = background.height * coef;
        let alphaVal = c;

        if (alphaVal >= 610)
            alphaVal = 610;
        else if (alphaVal <= 0)
            alphaVal = 0

        canvasCtx.globalAlpha = alphaVal / 1000;
        x = parseInt((canvas.width / 2) - (width / 2));
        canvasCtx.drawImage(background, x, y, width, height);
        canvasCtx.globalAlpha = 1;
        //Draw spectrum
        const barWidth = (canvas.width / bufferLength) * 1; //2.2;
        let posX = 0, posY = 0;
        const dateText = getFormatedDate();
        for (let i = 0; i < bufferLength; i++) {
            let audioValue = dataArray[i];
            const barHeight = (audioValue + 140) * 2;
            posY = canvas.height - barHeight * 2 
            canvasCtx.fillStyle = `rgb(${Math.floor((barHeight / 1.4) + 140)}, 50, 50, 0.66)`;
            canvasCtx.fillRect(
                posX,
                posY,
                barWidth,
                barHeight * 2,
            );
            canvasCtx.font = "25px sans-serif";
            canvasCtx.textAlign = 'left';
            canvasCtx.fillStyle = `#f1f1f1`;
            canvasCtx.fillText(dateText, 10, 36);
            /*canvasCtx.font = "15px sans-serif";
            canvasCtx.textAlign = 'center';
            canvasCtx.fillStyle = `#f1f1f1`;
            canvasCtx.fillText(Math.abs(Math.round(audioValue).toString()), posX + 10, posY - 5, barWidth);*/
            posX += barWidth + 1;
        }

        //Schedule next redraw
        requestAnimationFrame(() => {
            draw(c, d, i, analyserNode, dataArray,  bufferLength, canvasCtx, canvas, background, imgList);
        });

        c = null, d = null, i = null, analyserNode = null, dataArray = null,  bufferLength = null, canvasCtx = null, canvas = null, background = null, imgList = null;
    };

    JSPlayer.Vizualizer = {
        draw
    }

})(this, document, this.JSPlayer);