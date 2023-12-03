class ImageResizer{
    constructor(){
        this.maxWidth = 600;
        this.maxHeight = 600;
        this._ret;
        this.limit_max_size = (1024 * 1024 * 10);//10mb
    }
    processFile(file){
        return new Promise(async (resolve, reject)=>{
            this._ret = {
                pre_file: file,
                pre_size: file.size,
                pre_base64: await this.fileToBase64(file),
                type: file.type
            };
            this._process()
            .then(()=>{
                resolve(this._ret.pos_file);
            })
            .catch((msg)=>{
                reject(msg);
            });
        })
    }
    processBase64(base64){
        return new Promise(async (resolve, reject)=>{
            let file = this.base64ToFile(base64);
            this._ret = {
                pre_file: file,
                pre_size: file.size,
                pre_base64: base64,
                type: file.type
            };
            this._process()
            .then(()=>{
                resolve(this._ret.pos_base64);
            })
            .catch((msg)=>{
                reject(msg);
            });
        });
    }
    _process(){
        return new Promise(async (resolve, reject)=>{
            try{

                if(this._ret.pre_size > this.limit_max_size){
                    reject("Max size " + this.limit_max_size + "mb");
                    return;
                }
    
                let canvas = document.createElement("canvas");
                let ctx = canvas.getContext('2d');
    
                let img = new Image();
                img.onload = () => {
                    if(img.width > this.maxWidth){
                        let aux = img.height * this.maxWidth / img.width;
                        canvas.height = aux;
                        canvas.width = this.maxWidth;
                        ctx.drawImage(img, 0, 0, this.maxWidth, aux);
                    }else if(img.height > this.maxHeight){
                        let aux = img.width * this.maxHeight / img.height;
                        canvas.height = this.maxHeight;
                        canvas.width = aux;
                        ctx.drawImage(img, 0, 0, aux, this.maxHeight);
                    }else{
                        canvas.height = img.height;
                        canvas.width = img.width;
                        ctx.drawImage(img, 0, 0, img.width, img.height);
                    }
                    
                    this._ret.pos_base64 = ctx.canvas.toDataURL(this._ret.type);
                    let ext = this._ret.type;
                    ext = ext.substring( ext.lastIndexOf("/") + 1);
                    this._ret.pos_file = this.base64ToFile(this._ret.pos_base64, "imagen." + ext);
                    resolve(true);
                }
                console.log(this._ret);
                img.src = this._ret.pre_base64;
            
            }catch(err){
                reject(err);
            }
        });
    }
    base64ToFile(base64, filename){
        let arr = base64.split(','), mime = arr[0].match(/:(.*?);/)[1],
	        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
	    while(n--){
	        u8arr[n] = bstr.charCodeAt(n);
	    }
	    return new File([u8arr], filename, {type:mime});
    }
    fileToBase64(file){
        return new Promise(resolve=>{
            let reader = new FileReader();
            
            reader.onload = function () {
                resolve(reader.result);
            };

            reader.onerror = function (error) {
                console.log('Error: ', error);
                resolve(undefined);
            };
            
            reader.readAsDataURL(file);
        });
    }
    URItoDataURL(src){
        return new Promise((resolve)=>{
			let img = new Image();
			img.onload = () =>{
				let canvas = document.createElement('canvas');
				let ctx = canvas.getContext('2d');
				canvas.width = img.width;
				canvas.height = img.height;
				ctx.drawImage(img, 0, 0);
				resolve(canvas.toDataURL(), img.width, img.height);
			}
			img.src = src;
		});
    }
}