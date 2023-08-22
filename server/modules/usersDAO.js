const basicDB=require('./basicDB');
const crypto = require('crypto');

class UsersDAO extends basicDB.BasicDB{
    /*
	"id"	INTEGER NOT NULL UNIQUE,
	"name"	TEXT,
	"partTime"	INTEGER NOT NULL,
	"userName"	TEXT,
	"password"	TEXT,
	"salt"	TEXT,
 */
    constructor(){
        super();
    }
    async getUser(username, password){		//TESTED WORKING
		const sql='SELECT * FROM users WHERE username=?';
		const res= await this.querySelect(sql,[username],true).catch((err)=>{throw err});

		return new Promise((resolve, reject)=>{
			crypto.scrypt(password, res.salt, 32, function (err, hashedPsw) {
				if (err)
					reject(err);

				let user;
				let planType;
				switch(res.partTime){
					case 1:
						planType='part';
						break;
					case 0:
						planType='full';
						break;
					default:
						planType='none'
						break;
				}
				const hashBuff=Buffer.alloc(32, res.password, 'hex');
				
				if (crypto.timingSafeEqual(hashBuff, hashedPsw)) {
					
					user = { id: res.id, name: res.name, planType:planType }
				} else {
					user = false
				}
				resolve(user)
			})

		})
    }

	 async checkUser(id){
		const sql='SELECT * FROM users WHERE id=?';
		const res= await this.querySelect(sql,[id],true).catch((err)=>{throw err})
		if(res==undefined)
			return false
		else
			return true;
		
	}

	async setUserPlanType(userId, plan){
		const sql='UPDATE users SET partTime=? WHERE id=?';
		const params=[plan=='part'?1:plan=='full'?0:-1, userId]
		const res= await this.queryRun(sql,params);
		return res
	}

	async getUserPlanType(userId){
		const sql='SELECT partTime FROM users WHERE id=?';
		const res= await this.querySelect(sql,[userId], true);
		
		switch(res.partTime){
			case 1:
				return 'part';
			case 0:
				return 'full';
			default:
				return 'none'
		}
	}
}

module.exports={UsersDAO}