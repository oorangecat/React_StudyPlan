'use strict'
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';

import {Course, CourseTable} from "./components/CourseTable"
import {LogoNavBar, MainNavBar} from "./components/NavBar"
import {LoginForm} from "./components/LoginForm"

import {getCourses, getStudyPlan, postStudyPlan,postStudyPlanList, postStudyPlanType, deleteStudyPlan} from "./services/coursesAPI"
import {login,getUserInfo,logout} from "./services/userAPI"
import {partTimeCredits, fullTimeCredits} from './config'



function App() {
  const [logged, setLogged]=useState(false);
  const [courses, setCourses]=useState([]);
  const [coursesUpdated, setCoursesUpdated]=useState(false);
  const [studyPlan, setStudyPlan]=useState({exist: false, courses:[]});
  const [planType, setPlanType]=useState('full')
  const [currentCredits, setCurrentCredits]=useState(0);
  const [creditsRange, setCreditsRange]=useState({});
  const [user, setUser]=useState({});


  useEffect( ()=>{
    getCourses().catch((err) => {setCourses([]);}).then((courses)=>setCourses(courses)).then(()=>{ setCoursesUpdated(true);} );
    getUserInfo().catch((err)=> {setLogged(false);}).then((user)=>setLogged(true));
    
  }, []) //initial operations, run after the initial rendering, so async by design

  useEffect(()=>{
    if(logged){
      getUserInfo().then((user)=>{(user.hasOwnProperty('planType') && !studyPlan.exist) && applyPlanType(user.planType); setUser(user);})
                    .catch((err)=>{setLogged(false); setUser({});});             
    }
  },[logged])

  useEffect(()=>{ //updates credits at studyPlan update
    if(studyPlan.exist && studyPlan.courses.length){
        const res=studyPlan.courses.map((el)=>el.credits).reduce((prev,curr)=>prev+=curr);
        setCurrentCredits(res);
    } else {
      setCurrentCredits(0);
    }
    setCoursesUpdated(true);
  },[studyPlan])


  useEffect(()=>{if(coursesUpdated){validateCourses(); setCoursesUpdated(false);}},[coursesUpdated])

  const applyPlanType=(selectedPlan)=>{

    setPlanType(selectedPlan);      //applies async!

    if(!studyPlan.exist && selectedPlan != 'none'){
      getStudyPlan().then((plan)=>  setStudyPlan({exist: true, courses: plan}))      //fetch studyPlan in case a persistent version exists
                    .catch((err)=> {setStudyPlan({exist:false, courses:[]}); setLogged(false);throw err})                       //if an error occurs, probably the user is not logged
    }

    switch(selectedPlan){
    case 'full':
        setCreditsRange(fullTimeCredits);
        break;
    case 'part':
        setCreditsRange(partTimeCredits);
        break;
    default:
        setCreditsRange({});      
        break;   
    }

    postStudyPlanType(selectedPlan).catch((err)=>{throw err});    //set the plan also server-side
  }

  const createPlan=(selectedPlan)=>{
    if(!studyPlan.exist)
      setStudyPlan({exist:true, courses:[]});
    
    applyPlanType(selectedPlan);
  }

  const userPlanDelete = ()=>{
      deleteStudyPlan().then(()=> {setStudyPlan({exist:false, courses:[]}); applyPlanType('none')}).catch((err)=>{throw err;})
  }

  //Adds the right value of "available" to courses in studyPlan, performing validation of studyplan
  const validatePlan = () => {
    
    validateCourses();
    for(let ex of studyPlan.courses){
      const course=courses.find((el)=>el.code==ex.code)
      if(!course.available){
        throw (course.availableReason);
      }
    }
    return true;
  }


  const validateCourses = () => {
    let currentCourses=JSON.parse(JSON.stringify(courses));    

    if(logged){
      for(let idx in currentCourses){
        currentCourses[idx].available=undefined;

        if(currentCredits>creditsRange.max){
          currentCourses[idx].available=false;
          currentCourses[idx].availableReason='You have exceeded the maximum credits allowed in your StudyPlan. Please remove a course to be able to save your plan.';
          continue;
        }

        if(!studyPlan.courses.some((el)=>el.code==currentCourses[idx].code) && currentCourses[idx].maxStudents>0 && currentCourses[idx].subscribedUsers>=currentCourses[idx].maxStudents){
          currentCourses[idx].available=false;
          currentCourses[idx].availableReason=`The limit of ${currentCourses[idx].maxStudents} students has been reached, no more applications can be accepted for this course.`;
          continue;
        }
        if(currentCourses[idx].incompatibleWith){
          for(let incompatibleEx of currentCourses[idx].incompatibleWith){
                const wrongEx=studyPlan.courses.find((el)=>el.code==incompatibleEx);
                if(wrongEx){    //if an incompatible exam is in studyPlan, mark the course as not available
                    currentCourses[idx].available=false;
                    currentCourses[idx].availableReason=` ${currentCourses[idx].code} is not compatible with exam ${wrongEx.code}`;
                    continue;
                }
            };
        }
        
        if(currentCourses[idx].preparatoryCourse){
          const ex=studyPlan.courses.find((el)=>el.code==currentCourses[idx].preparatoryCourse)
          if(!ex){
              currentCourses[idx].available=false;
              currentCourses[idx].availableReason=`Exam ${currentCourses[idx].code} requires exam ${currentCourses[idx].preparatoryCourse} but it is not found on current Study Plan.`;
              continue;
            }

        }
        if(currentCourses[idx].available===undefined){
          currentCourses[idx].available=true;
          currentCourses[idx].availableReason="";
        }
      }
      setCourses(JSON.parse(JSON.stringify(currentCourses)));
      
    } else {
      for(let idx in currentCourses){
        currentCourses[idx].available=true;
        currentCourses[idx].availableReason='';
      }
      if(currentCourses.length>0)     //Sometimes, because of async operations in background, this may overwrite a newly fetched array of courses
        setCourses(JSON.parse(JSON.stringify(currentCourses)));

    }}
  
  
  const userPlanSave = async ()=>{
  
    try{
      if(studyPlan.courses.length==0){
        await deleteStudyPlan();
        return true;
      }
      await postStudyPlanList(studyPlan.courses);
      return true;
    } catch(err){
      if(err===401){
          throw ('User not logged in');
      } else 
        throw ('Server error');
    }

  }

  const logoutHandler = async (event)=>{
    try{
      event.preventDefault();     //Needed for Firefox, working without it on chromium
      await logout();
      //Updates states
      setLogged(false);
      setStudyPlan({exist: false, courses:[]})
      setCoursesUpdated(true);
      return true;
    } catch (err){ 
      throw err;
    }
  }

  const loginHandler = async (cred)=>{
    try {
      const user = await login(cred);
      if(user) {
        setLogged(true);
        user.hasOwnProperty('planType') && applyPlanType(user.planType);
        return true;
      } else {
        return false;
      }
    } catch (err) {
      return false;
    }
  } 

  return (
    <div className="App justify-content-center">
      <LogoNavBar/>
      <MainNavBar logged={logged} logoutHandler={logoutHandler} user={user}/>
      <Router>
        <div className="App shadow rounded-3 p-4 ms-5 me-5 mt-5 mb-1 "> 
          <Routes>
              <Route path='/login' element={<LoginForm login={loginHandler} />}> </Route>
              <Route path="/" element={<CourseTable courses={courses} 
                                                    setCourses={setCourses}
                                                    studyPlan={studyPlan} 
                                                    getStudyPlan={getStudyPlan}
                                                    logged={logged} 
                                                    setStudyPlan={setStudyPlan} 
                                                    deleteStudyPlan={userPlanDelete} 
                                                    saveStudyPlan={userPlanSave}
                                                    postStudyPlan={postStudyPlan}
                                                    credits={currentCredits} 
                                                    setCredits={setCurrentCredits}
                                                    planType={planType} 
                                                    setPlanType={setPlanType}
                                                    createPlan={createPlan}
                                                    creditsRange={creditsRange}
                                                    validatePlan={validatePlan}

                                                    ></CourseTable>}></Route>    
          </Routes>
        </div>
      </Router>
      <p style={{color:"gainsboro"}}>Developed with <del>an incredible amount of tears</del> {"<3"} by Marco Manieri</p>
    </div>
  );
}

export default App;
