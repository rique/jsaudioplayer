(function(window, document, undefined) {
    
    window.JSPlayer = window.JSPlayer || {};

    const generateLoremText = (numParagraphs, numWords, words) => {
        let loremText = '';
        words = words || [
            'Lorem',
            'ipsum',
            'dolor',
            'sit',
            'amet',
            'consectetur',
            'adipiscing',
            'elit',
            'sed',
            'do',
            'eiusmod',
            'tempor',
            'incididunt',
            'ut',
            'ut',
            'labore',
            'et',
            'dolore',
            'magna',
            'magnam',
            'aliqua',
            'Ut',
            'enim',
            'in',
            'ad',
            'minim',
            'veniam',
            'quis',
            'nostrud',
            'exercitation',
            'ullamco',
            'laboris',
            'nisi',
            'ut',
            'aliquip',
            'ex',
            'ea',
            'commodo',
            'consequat',
            'Duis',
            'aute',
            'irure',
            'et',
            'est',
            'dolor',
            'in',
            'reprehenderit',
            'in',
            'voluptate',
            'velit',
            'esse',
            'cillum',
            'dolore',
            'eu',
            'fugiat',
            'nulla',
            'pariatur',
            'Excepteur',
            'sint',
            'occaecat',
            'cupidatat',
            'non',
            'proident',
            'sunt',
            'in',
            'culpa',
            'qui',
            'quid',
            'quam',
            'quo',
            'officia',
            'deserunt',
            'mollit',
            'morietur',
            'anim',
            'id',
            'est',
            'laborum',
            'besto',
            '10',
            '11',
            '12',
            '22',
            '28',
            'Itaque',
            'modorenai',
            'earum',
            'rerum',
            'Maximus',
            'tenetur',
            'a',
            'sapiente',
            'dominam',
            'facilis',
            '1',
            '2',
            'quidem',
            'delectus',
            'delectam',
            'nobis',
            'eligendi',
            'optio',
            'cumque',
            'impedit',
            'minus',
            'maxima',
            'maxime',
            'labora',
            'placeat',
            'facere',
            'possimus',
            'omnis',
            'alias',
            'et',
            'id',
            'sit',
            '5',
            '8',
            'vorbis',
            'comentitur',
            'tremens',
            'quando',
            'Regis',
            'expectare',
            'vel',
            'voluptas',
            'quam',
            'nihil',
            'molestiae',
            'consequatur',
            'autem',
            'Quis',
            'eum',
            'iure',
            'corpum',
            'Corpus',
            'magnam',
            'aliquam',
            'quaerat',
            'voluptatem',
            'fugit',
            'perspiciatis',
            'error',
            'accusantium',
            'doloremque',
            'dolorem',
            'laudantium',
            'totam',
            'rem',
            'aperiam',
            'arepam',
            'architecto',
            'beatae',
            'vitae',
            'dicta',
            'loream',
            'explicabo',
            'Nemo',
            'Lucius',
            'aqua',
            'dignissimos',
            'ducimus',
            'blanditiis',
            'praesentium',
            'voluptatum',
            'deleniti',
            'atque',
            'corrupti',
            'quos',
            'dolores',
            'quas',
            'molestias',
            'excepturi',
            'sint',
            'occaecati',
            'et',
            'cupiditate',
            'provident',
            'in',
            'similique',
            'sunt',
            'mollitia',
            'animi',
            'voluptatibus',
            'maiores',
            'recusandae',
            'cuius',
            'accusamus',
            'doloribus',
            'asperiores',
            'perferendis',
            'repellat',
            'assumenda',
            'quibusdam',
            'eveniet'
        ];

        for (let i = 0; i < numParagraphs; i++) {
            let paragraph = '';
            for (let j = 0; j < numWords; j++) {
                let randomWord = words[Math.floor(Math.random() * words.length)];
                paragraph += randomWord + ' ';
            }
            loremText += paragraph;
        }
        return loremText;
    }

    const getFormatedDate = () => {
        const DateTime = luxon.DateTime;
        const d = DateTime.now().setZone('Europe/Paris');
        return d.setLocale('es').toLocaleString(DateTime.TIME_WITH_SECONDS);
    }
    
    
    const uuidv4 = () => {
        return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
        (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
        );
    };

    const readCookie = (name) => {
        let nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    };
    
    const blob2Uint8Array = (blob) => {
        return new Response(blob).arrayBuffer().then(buffer=> {
            return [...new Uint8Array(buffer)];
        });
    };
    
    
    const clearElementInnerHTML = (element) => {
        while(element.firstChild)
            element.removeChild(element.firstChild);
    };

    const getLastParent = (elem, depth) => {
        let counter = 0;
        while(elem.parentElement && elem.parentElement != document.body) {
            elem = elem.parentElement;

            if (typeof depth === 'number' && depth > counter) {
                break;
            }
            ++counter;
        }

        return elem;
    }
    
    const whileMousePressedAndMove = (element, cb, doMouseout) => {    
        if (typeof doMouseout === 'undefined')
            doMouseout = false;
    
        let mouseID = -1, mouseMoveID = -1;
        
        const mousedown = (evt) => {
            mouseID = 1;
            cb.bind(cb, evt, true)();
        }
    
        const mousemove = (evt) => {
            if (mouseID != -1) {
                mouseMoveID = 2;
                cb.bind(cb, evt, true)();
            }
        };
    
        const mouseup = (evt) => {
            if (mouseID != -1) {
                mouseID = -1;
                cb.bind(cb, evt, false)();
            }
        }
    
        element.addEventListener("mousedown", mousedown);
        document.addEventListener('mousemove', mousemove);
        document.addEventListener("mouseup", mouseup);
    
        if (doMouseout)
            element.addEventListener('mouseout', mouseup);
    };
    
    const whileMousePressed = (element, cb, interval) => {
        if (typeof interval === 'undefined')
            interval = 100;
        
        let mouseID = -1;
        
        const mousedown = (evt) => {
            if (mouseID == -1)
                mouseID = setInterval(cb.bind(cb, evt), interval);
        }
    
        const mouseup = () => {
            if (mouseID != -1) {
                clearInterval(mouseID);
                mouseID = -1;
            }
        }
    
        element.addEventListener("mousedown", mousedown);
        element.addEventListener("mouseup", mouseup);
        element.addEventListener("mouseout", mouseup);
    };

    function getRandomInt(min, max) {       
        const randomBuffer = new Uint32Array(1);
    
        window.crypto.getRandomValues(randomBuffer);
    
        let randomNumber = randomBuffer[0] / (0xffffffff + 1);
    
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(randomNumber * (max - min + 1)) + min;
    }

    const getPercentageWidthFromMousePosition = (clientX, htmlItem, margin) => {
        if (typeof margin === 'undefined')
            margin = 0;
        
        let widthPixel = (clientX - margin) - (htmlItem.offsetLeft() + htmlItem.offsetParent().offsetLeft),
            totalWidth = htmlItem.offsetWidth();
        
        return widthPixel / totalWidth;
    }

    const shuffle = (list, index) => {
        let item;
        if (!isNaN(index))
            item = list.splice(index, 1)[0];
        for (let i = list.length - 1; i > 0; i--) {
            let j = Math.floor(getRandomInt(0, i + 1));
            //let j = Math.floor(Math.random() * (i + 1));
            [list[i], list[j]] = [list[j], list[i]];
        }
        if (item)
            list.splice(0, 0, item);
        return list;
    }
    
    window.JSPlayer.Utils = {
        readCookie, 
        blob2Uint8Array, 
        clearElementInnerHTML,
        getFormatedDate,
        uuidv4,
        generateLoremText,
        getLastParent,
        whileMousePressedAndMove,
        whileMousePressed,
        getRandomInt,
        getPercentageWidthFromMousePosition,
        shuffle
    };

})(this, document);