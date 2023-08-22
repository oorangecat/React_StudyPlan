sqlite = require("sqlite3");

class BasicDB{
    constructor(){
        this.db=new sqlite.Database('./studyplan.db', (err)=>{ if (err) throw err});
    }

    async querySelect(sql, params, single=false){
        return new Promise((resolve,reject)=>{
            if(!single){
             
            this.db.all(sql,params,(err,rows)=>{
                if (err) 
                    reject (err);
                else 
                    resolve(rows);
            })
         } else {
                this.db.get(sql,params,(err,row)=>{
                    if (err) 
                        reject (err);
                    else                         
                       resolve(row);
                    
                })
            }
        })
    }
    async queryRun(sql, params){
        return new Promise((resolve, reject)=>{
            this.db.run(sql, params, function (err){
                if(err)
                    reject (err)
                else 
                    resolve (true);
            })
        })
    }      
}
module.exports={BasicDB}