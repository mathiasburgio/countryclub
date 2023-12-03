class ImageUploader{
    constructor(container, pathImages = "/", defaultImage = "#", resizer = undefined, callback = undefined){
        this.value = defaultImage;
        this.pathImages = pathImages;
        this.defaultImage = defaultImage;
        this.enabled = true;
        this.container = container;
        this._html = `   <div style='width:100px; height:100px; border:solid 1px #aaa; overflow:hidden; position:relative; text-align:center; display: flex; align-items:center'>
                            <img src="${pathImages + defaultImage}" alt="subir imagen" style='max-width:100px; max-height:100px'>                        
                            <i class='fas fa-times' style='width:20px; height:20px; text-align:center; border:solid 1px red; color: red; position:absolute; top:0px; right:0px; z-index:3; background:rgba(80,80,80,0.5); cursor:pointer'></i>
                            <i class='fas fa-file-upload' style='width:20px; height:20px; text-align:center; border:solid 1px #ffc107; color: #ffc107; position:absolute; top:0px; right:21px; z-index:3; background:rgba(80,80,80,0.5); cursor:pointer'></i>
                            <input type='file' style='position:absolute; top: -100px;'>
                        </div>`;

        this.container.innerHTML = this._html;

        this.container.querySelector(".fa-file-upload").addEventListener("click", ()=>{
            if(this.enabled){ this.container.querySelector("input").click(); }
        });

        this.container.querySelector(".fa-times").addEventListener("click", ()=>{
            if(this.enabled){ this.clear(); }
        });

        this.container.querySelector("input").addEventListener("change", (ev)=>{
            let files = this.container.querySelector("input").files;
            if(files){
                let file = files[0];
                console.log(file);
                if(file.type == "image/jpeg" || file.type == "image/png"){
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        container.querySelector("img").setAttribute("src", e.target.result);
                        
                        if(resizer){
                            resizer.processFile(file)
                            .then(ret=>{
                                if(callback){ callback(ret); }
                            })
                            .catch(ret=>{
                                if(callback){ callback(false); }
                            });
                        }else{
                            if(callback){ callback(e.target.result); }
                        }
                    }
                    reader.readAsDataURL(file);
                } 
            }
        });
    }
    setEnabled(e){
        this.enabled = e;
    }
    clear(){
        this.value = this.defaultImage;
        this.container.querySelector("img").setAttribute("src", this.pathImages + this.defaultImage);
    }
    setImage(e){
        this.value = e;
        this.container.querySelector("img").setAttribute("src", this.pathImages + e);
    }
    upload(url){
        return new Promise(resolve=>{
            let fd = new FormData();
            fd.append("image", this.container.querySelector("input").files[0]);
            $.post({
                url: url,
                data: fd,
                cache: false,
                processData: false,
                contentType: false,
                timeout: 10000 
            })
            .done((res)=>{
                //must return {status: (1 | 0), name: string}
                if(typeof res == "string"){ res = JSON.parse(res); }
                if(res.status){
                    this.setImage(res.message);
                    resolve(res.message);
                }else{
                    resolve(false);
                }
            })
            .fail((res)=>{
                resolve(false);
            });
        });
    }
}