
const URL='http://localhost:3001/api/courses'
const {Course}=require('../components/CourseTable');

async function getCourses(){
    const queryURL=URL;

    const response = await fetch(queryURL,{});
    const coursesJSON = await response.json();      //fetch in JSON of the body
    if(response.ok)
    {
       return coursesJSON.map((course)=>new Course(course.code, course.name, course.credits, course.maxStudents, course.incompatibleWith, course.preparatoryCourse, course.subscribedUsers))
    } else {
        throw coursesJSON;      //Contains the error
    }


}

async function getStudyPlan(){
    const queryURL=URL+'/studyplan/'
    const response= await fetch(queryURL, {
        credentials: 'include',
    })
    
    const studyPlanJSON= await response.json();

    if(response.ok){
        return studyPlanJSON.map((course)=>new Course(course.code, course.name, course.credits, course.maxStudents, course.incompatibleWith, course.preparatoryCourse, course.subscribedUsers))
    } else {
        throw studyPlanJSON;
    }
  
}

async function postStudyPlan(exam){
    const queryURL=URL+'/studyplan/'+exam.code
    const response = await fetch(queryURL, {
        method: 'POST',
        credentials:'include'
    })

    if(response.ok)
    {
        return true;
    }
    else {
       const errorJSON = await response.json();
       throw errorJSON;             
    }
}

async function postStudyPlanList(exams){
    const queryURL=URL+'/studyplan/'

    const exCodes=exams.map((ex)=>ex.code);
    const response = await fetch(queryURL, {
        method: 'POST',
        credentials:'include',
        headers: {'Content-Type': 'application/json'},
        body:JSON.stringify(exCodes)
    })

    if(response.ok)
    {
        return true;
    } else {
       throw response.status;             
    }
}

async function postStudyPlanType(newType){
    const queryURL=URL+'/studyplan/type'
    const typePlan={type:newType};
    const responde= await fetch(queryURL,{
        method: 'POST',
        credentials:'include',
        headers: {'Content-Type': 'application/json'},
        body:JSON.stringify(typePlan)
    })
}


async function deleteStudyPlan(){
    const queryURL=URL+'/studyplan/'

    const response = await fetch(queryURL, {
        method: 'DELETE',
        credentials:'include'
    })

    if(response.ok)
    {
        return true;
    }
    else {
       const errorJSON = await response.json();
       throw errorJSON;             
    }
}




module.exports={getCourses, getStudyPlan, postStudyPlan, postStudyPlanList, postStudyPlanType, deleteStudyPlan}