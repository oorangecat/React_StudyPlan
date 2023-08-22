const basicDB=require('./basicDB');

function Course(code, name, credits, maxStudents, incompatibleWith, preparatoryCourse, subscribedUsers){
    this.code=code; 
    this.name=name;
    this.credits=credits;
    this.maxStudents=maxStudents;
    this.incompatibleWith=incompatibleWith;
    this.preparatoryCourse=preparatoryCourse;
    this.subscribedUsers=subscribedUsers;
}

class CoursesDAO extends basicDB.BasicDB{
    /* TABLE courses:
	"code"	TEXT NOT NULL UNIQUE,
	"name"	TEXT,
	"credits"	INTEGER,
	"maxStudents"	INTEGER,
	"incompatibleWith"	TEXT,
	"preparatoryCourse"	TEXT,
	"subscribedUsers"	INTEGER

    TABLE studyPlan:
	"userId"	INTEGER NOT NULL,
	"exam"	TEXT NOT NULL,

    TABLE coursesIncompatibleWith:
	"course"	TEXT NOT NULL,
	"incompatibleWith"	TEXT NOT NULL,
	PRIMARY KEY("course","incompatibleWith"),
	FOREIGN KEY("incompatibleWith") REFERENCES "courses"("code"),
	FOREIGN KEY("course") REFERENCES "courses"("code")

 */
    constructor(){
        super();
    }

     async getIncompatibleCourses(courseCode){
        const sql='SELECT * FROM coursesIncompatibleWith WHERE course=?'
        const res= await this.querySelect(sql,[courseCode]).catch((err)=>{throw err});
        return res.map((row)=>row.incompatibleWith)
     }

     async getAllCourses(){
        const sql='SELECT * FROM courses;';
        const res= await this.querySelect(sql,[]).catch((err)=>{throw err});
        if(res==undefined)
            return false;
        const courses=await Promise.all(res.map(async (row)=>{
            const incompatible=await this.getIncompatibleCourses(row.code)
            return new Course(row.code, row.name, row.credits, row.maxStudents?row.maxStudents:0, incompatible.length>0?incompatible:[], row.preparatoryCourse?row.preparatoryCourse:"", row.subscribedUsers?row.subscribedUsers:0)
        }));   
        return courses;
    }

     async getStudyPlan(studentId){
        const sql='SELECT c.code, c.name, c.credits, c.maxStudents, c.preparatoryCourse, c.subscribedUsers FROM courses c, studyPlan p WHERE c.code=p.exam AND p.userId=?';
        
        const res= await this.querySelect(sql, [studentId]).catch((err)=>{throw err});
        if (res==undefined)
            return false
        const courses=Promise.all(res.map(async (row)=>{
            const incompatible=await this.getIncompatibleCourses(row.code);
            return new Course(row.code, row.name, row.credits, row.maxStudents, incompatible, row.preparatoryCourse, row.subscribedUsers)
        }));   
        return courses;
    }

    //Insert a course inside the studyplan
    //Takes an array of coursesIDs as arg

    async insertStudyPlan(studentId, course){
        
        const sql='INSERT INTO studyPlan(userId, exam) VALUES (?,?)'
        const params=[studentId, course]
        await this.queryRun(sql, params).catch((err)=>{throw err});

        const sql2='UPDATE courses SET subscribedUsers=subscribedUsers+1 WHERE code=?';
        const params2=[course];
        await this.queryRun(sql2, params2).catch((err)=>{throw err});

    }

    //Delete single exam from studyPlan 
     async deleteExamStudyPlan(studentId, courseCode){
        const sql='DELETE FROM studyPlan WHERE userId=? AND exam=?'
        const params=[studentId, courseCode];
        await this.queryRun(sql,params).catch((err)=>{throw err});

        const sql2='UPDATE courses SET subscribedUsers=subscribedUsers-1 WHERE code=?';
        const params2=[courseCode];
        await this.queryRun(sql2, params2).catch((err)=>{throw err});    
    }
    
    //Delete the whole studyPlan of the student
     async deleteStudyPlan(studentId){
        const courses=await this.getStudyPlan(studentId);
        const ids= courses.map((row)=>row.code)
        for(let courseid of ids){
            await this.deleteExamStudyPlan(studentId, courseid)
        }
        // courses.forEach(async (element)=>{
        //     await deleteExamStudyPlan(studentId, element.code)
        // });
    }
}

module.exports = {CoursesDAO, Course};