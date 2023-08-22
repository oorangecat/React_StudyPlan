'use strict';

const express = require('express');

const {CoursesDAO}=require('../modules/coursesDAO')
const coursesDAO=new CoursesDAO()
const {UsersDAO}=require('../modules/usersDAO');
const usersDAO=new UsersDAO();
const { isLoggedIn, authFailure} = require('./usersRouter');
const {partTimeCredits, fullTimeCredits}=require('../config')

const coursesRouter = express.Router();
const dbErr=(res)=>{return res.status(500).end() }      //DB errors are not passed to the frontend



//GET all courses available at the university. No auth
coursesRouter.get('/',async(req,res)=>{

    try{
        const courses=await coursesDAO.getAllCourses();
        if(!courses)
            return res.status(404).json({error: "No courses found"});
        else 
            return res.status(200).json(courses);
    } catch(err){
        return dbErr(res);
    }

})

//GET single student studyplan
coursesRouter.get('/studyplan', isLoggedIn,async (req,res)=>{
//Assume that DB is consistent as checks are performed at insert time
//user infos are in req.user
    try{
        const courses=await coursesDAO.getStudyPlan(req.user.id);
            
        if(!courses)
            return res.status(200).json([])     //Empty array if no studyplan is found
        else 
            return res.status(200).json(courses);   
    }  catch (err){
        return dbErr(res);
    }   

})


//POST add list of exams to student studyplan
//accepts an array of exam codes
coursesRouter.post('/studyplan/', isLoggedIn, async(req,res)=>{
    const courses=req.body;
    const planType= await usersDAO.getUserPlanType(req.user.id); 

    
    if(courses.length==0){
        return res.status(422).json({error: "Empty request"});
    }

    
    try{ 
        const allCourses=await coursesDAO.getAllCourses();
        let studyPlan=await coursesDAO.getStudyPlan(req.user.id);
        let newPlan=[];
        let credits=0;

        for(let courseid of courses){
            let newCourse=allCourses.filter((row)=>row.code==courseid);
            newCourse=newCourse[0];
            credits+=newCourse.credits;

            if(newCourse==undefined)
                return res.status(422).json({error: `Course ${courseid} not found`});            //Validation of inserted ID

            
            //VALIDATE PREPARATORY COURSES
            if(newCourse.preparatoryCourse){
                if(!courses.includes(newCourse.preparatoryCourse)){
                    return res.status(422).json({error: `Mandatory course ${newCourse.preparatoryCourse} not found in study plan`})
                }
            }

            //VALIDATE INCOMPATIBLE COURSES
            if(newCourse.incompatibleWith){
                for(let incompatibleEx of newCourse.incompatibleWith){
                    if(courses.includes(incompatibleEx)){
                        return res.status(422).json({error: `Course ${incompatibleEx} is found in study plan and is not compatible with the added course`})

                    }
                }
            }
            
            //Does not add the exam if already present in studyPlan
            if(!studyPlan.some((el)=>el.code==courseid)){
                //VALIDATE MAXIMUM STUDENTS (only if the user did not have it already in studyPlan)
                if(newCourse.maxStudents && newCourse.maxStudents <= newCourse.subscribedUsers)
                return res.status(422).json({error:`Course ${courseid} has reached its maximum capacity, no more applications can be accepted`});

                newPlan.push(courseid);
            } 
        }
        
        //VALIDATE TOTAL CREDITS
        switch(planType){
            case 'part':
                if(credits<partTimeCredits.min)
                    return res.status(422).json({error: `Courses do not reach the minimum of ${partTimeCredits.min} required`})
                else if(credits>partTimeCredits.max)
                    return res.status(422).json({error: `Courses exceed the maximum of ${partTimeCredits.max} required`})
                break;
            case 'full':
                if(credits<fullTimeCredits.min)
                    return res.status(422).json({error: `Courses do not reach the minimum of ${fullTimeCredits.min} required`})
                else if(credits>fullTimeCredits.max)
                    return res.status(422).json({error: `Courses exceed the maximum of ${fullTimeCredits.max} required`})
                break;
            default:
                return res.status(401).end();
        }
        //REMOVE all removed courses
        const removedCourses=studyPlan.filter((el)=>!courses.includes(el.code)).map((el)=>el.code)
        for(let courseid of removedCourses){
            await coursesDAO.deleteExamStudyPlan(req.user.id, courseid);
        }
        for(let courseid of newPlan){
            await coursesDAO.insertStudyPlan(req.user.id, courseid); 
        }
        return res.status(201).end();  
    
    } catch (err) {
        return dbErr(res);
    };
})




//DELETE delete full exam studyplan
coursesRouter.delete('/studyplan/',isLoggedIn,async (req,res)=>{
    try{
        const exist=await coursesDAO.getStudyPlan(req.user.id);
        if(!exist)
            return res.status(404).json({error:"No studyplan found for current user"});

        await coursesDAO.deleteStudyPlan(req.user.id).catch((err)=>{throw err;});
        res.status(204).end();
    }catch(err){
        return dbErr(res);
    }
})

//POST change studyplan type for user
coursesRouter.post('/studyplan/type',isLoggedIn, async (req, res)=>{
    const planType=req.body.type;
    const entries=['full','part','none'];
    if(!entries.includes(planType)){
      return res.status(422).json('Plan Type not recognised');
    } else {
      await usersDAO.setUserPlanType(req.user.id,planType);
      return res.status(200).end();
    }
})

module.exports=coursesRouter;