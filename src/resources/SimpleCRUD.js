/*
    structure: array of =>
    {
        label: str,
        width: str (50% | 30px),
        prop: str (prop of object),
        fn: function,
        right: bool (def false)
    }
*/
class SimpleCRUD{
    constructor({structure, searchProps, list, fnSearch, beforeSelect, afterSelect, beforeClear, afterClear, afterSearch, fnDblClick }){
        this.isNew = false;
        this._search = {
            word: "",
            ar: [],
            next: []
        };
        this.structure = structure;
        this.list = list;
        this.enabled = undefined;
        this.searchProps = searchProps;
        this.row = undefined;
        this.element = undefined;
        this.afterSelect = afterSelect;
        this.afterClear = afterClear;
        this.beforeSelect = beforeSelect;
        this.beforeClear = beforeClear;
        this.fnSearch = fnSearch;
        this.afterSearch = afterSearch;
        this.fnDblClick = fnDblClick;
    };

    setTable(dom){
        let html =`<table class='table table-sm' crud='table'>
                        <thead class='bg-primary text-white'>
                            <tr>`;
        this.structure.forEach(item=>{
            let r = (item.right ? "text-align:right;" : "");
            let w = (item.width ? "width:" + item.width + ";" : "");

            html += `<td style="${r + w}">${item.label}</td>`;
        });
        html +=             `</tr>
                        </thead>
                        <tbody></tbody>
                        <tfoot>
                            <tr>
                                <td colspan='${this.structure.length}' class='p-2'>
                                    <button class='btn btn-info btn-block'>Cargar más</button>
                                </td>
                            </tr>
                        </tfoot>
                    </table>`;
        dom.html(html);
        $("[crud='table'] tfoot button").click(()=>{
            this.showMoreResults();
        });
    }
    inicialize(){
        this.setButton("");
        this.clearFields();
        this.setEnableFields(false);
        
        if($("[crud='table'] tfoot button").length == 1){
            $("[crud='table'] tfoot button").prop("disabled", (this._search.next.length > 0 ? false : true) );
        }
        this.search("");
    }
    clearFields(){
        if(this.beforeClear){ this.beforeClear(); }
        $("[crud='fields'] [name]").val("");
        if(this.afterClear){ this.afterClear(); }
    }
    getDataToSave(){
        let obj = {};
        $("[crud='fields'] [name]").each((index,ev)=>{
            let name = $(ev).prop("name");
            let val = $(ev).val();

            if(name){ obj[name] = val; }//omite los que tienen name vacio
        });
        if(this.isNew){
            obj._action = "new";
            obj.id = -1;
        }else{
            obj._action = "modify";
            if(this.element._id){ obj._id = this.element._id; }//for mongo
            obj.id = this.element.id;
        }
        return obj;
    }
    afterSave(obj){
        if(obj._action == "new"){
            this.list.push(obj);
        }else{
            Object.assign(this.element, obj);
        }
        this.row = undefined;
        this.element = undefined;
        this.isNew = undefined;
        this.search("");
    }
    onNew(){
        this.setEnableFields(true);
        this.setButton("new");
        this.clearFields();
        $("[crud='fields'] [name]:eq(0)").focus();
        $("[crud='table'] .table-info").removeClass("table-info");
        this.isNew = true;
        this.row = undefined;
        this.element = undefined;
    }
    onModify(){
        this.setEnableFields(true);
        this.setButton("modify");
        $("[crud='fields'] [name]:eq(0)").focus();
        this.isNew = false;
    }
    setEnableFields(e){
        this.enabled = e;
        $("[crud='fields'] [name]").prop("disabled", !e);
    }
    setButton(btn){
        $("[crud='btNew']").removeClass("btn-primary").addClass("btn-light");
        $("[crud='btModify']").removeClass("btn-primary").addClass("btn-light");
        
        if(btn == "new"){
            $("[crud='btNew']").addClass("btn-primary").removeClass("btn-light");
        }else if(btn == "modify"){
            $("[crud='btModify']").addClass("btn-primary").removeClass("btn-light");
        }
    }
    search(word){
        if(typeof word == "undefined"){ word = ""; }
        word = word.toLowerCase();
        
        let ar = [];
        if(this.fnSearch){
            ar = this.fnSearch(word, this.list);    
            ar = JSON.parse(JSON.stringify(ar));
        }else{
            this.list.forEach(item=>{
                for(let i = 0; i < this.searchProps.length; i++){
                    if( item[this.searchProps[i]].toLowerCase().indexOf(word) > -1){
                        i = this.searchProps.length;
                        ar.push(item);
                    }
                }
            });
        }
        
        this._search = {
            word: word,
            ar: [],
            next: ar
        };

        //remove the first 100
        this._search.ar = this._search.next.splice(0,100);

        this.isNew = undefined;
        this.row = undefined;
        this.element = undefined;
        this.setEnableFields(false);
        this.clearFields();
        this.setButton();

        this.showSearch();
    }
    showSearch(){
        let html = "";
        this._search.ar.forEach(item=>{
            html += this.templateRow(item);
        });
        $("[crud='table'] tbody").html(html);

        if($("[crud='table'] tfoot button").length == 1){
            $("[crud='table'] tfoot button").prop("disabled", (this._search.next.length > 0 ? false : true) );
        }

        $("[crud='table'] tbody tr").click((ev)=>{
            let element = this.getElement( parseInt( $(ev.currentTarget).attr("idd") ) );

            if(this.beforeSelect){
                this.beforeSelect(element).then(ret=>{
                    this.onClickElement(ev);
                });
            }else{
                this.onClickElement(ev);
            }
        });
        $("[crud='table'] tbody tr").dblclick((ev)=>{
            let element = this.getElement( parseInt( $(ev.currentTarget).attr("idd") ) );
            if(this.fnDblClick){ this.fnDblClick(element); }
        });
        
        if(this.afterSearch){ this.afterSearch(); }
    }
    onClickElement(ev){
        let dom = $(ev.currentTarget);
        let idd = dom.attr("idd");
        let element = this.getElement( parseInt(idd) );
        this.element = element;
        this.row = dom;
        this.isNew = undefined;
        $("[crud='table'] .table-info").removeClass("table-info");
        dom.addClass("table-info");
        this.clearFields();
        this.setEnableFields(false);
        this.setButton();

        for(let prop in element){
            let dx = $("[crud='fields'] [name='" + prop + "']");
            if(dx.length == 1){ $("[crud='fields'] [name='" + prop + "']").val(element[prop]); }
        }

        if(this.afterSelect){ this.afterSelect(this.element); }
    }
    templateRow(obj){
        let html = `<tr idd="${obj.id}" style='cursor:pointer;'>`;
        this.structure.forEach(item=>{
            let r = (item.right ? "text-align:right;" : "");
            let w = (item.width ? "width:" + item.width + ";" : "");

            if(item.fn){
                html += `<td style='${r + w}'>${item.fn(obj[item.prop], obj)}</td>`;
            }else{
                html += `<td style='${r + w}'>${obj[item.prop]}</td>`;
            }
        });
        return html += "</tr>";
    }
    showMoreResults(){
        this._search.ar = this._search.ar.concat( this._search.next.splice(0,100) );
        this.showSearch();
    }
    getElement(id, index = false){
        let i = this.list.findIndex(item=>item.id === id);
        return (index ? i : this.list[i]);
    }
    removeSelected(){
        let aux = this.getElement(this.element.id, true);
        this.list.splice(aux,1);
        this.search("");
    }
}