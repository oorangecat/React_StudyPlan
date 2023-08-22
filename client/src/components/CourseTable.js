import { useEffect, useState } from 'react';
import {Table, Row, Col, Container, Button, Alert, ListGroup, Accordion, useAccordionButton} from 'react-bootstrap'
import {ReactComponent as Grip} from '../media/grip.svg'


function Course(code, name, credits, maxStudents, incompatibleWith, preparatoryCourse, subscribedUsers=0){
    this.code=code; 
    this.name=name;
    this.credits=credits;
    this.maxStudents=maxStudents;
    this.incompatibleWith=incompatibleWith;
    this.preparatoryCourse=preparatoryCourse;
    this.subscribedUsers=subscribedUsers;

    this.toString = ()=>{return `Code: ${this.code}, Name: ${this.name}, Credits: ${this.credits}, Maximum Students Subscribed: ${this.maxStudents},\
    Incompatible With: ${this.incompatibleWith}, Mandatory Preparatory Course: ${this.preparatoryCourse}, Subscribed Students: ${this.subscribedUsers}`}      //todo
}

//DRAG AND DROP event handlers
const onDragStart=(event, course)=>{
    event.dataTransfer.setData("course", JSON.stringify(course,null,1));       //binds the course to the event
}

const onDragOver=(event)=>{event.preventDefault()}       //Prevents default browser behaviour for drag over dropzone

const onDrop=(event,studyPlan,setStudyPlan)=>{      //Adds the dropped course to the state if it is not already present
    const course=JSON.parse(event.dataTransfer.getData("course"));          //A string will represent the course in the dataTransfer obj
    if(!studyPlan.courses.some((el)=> course.code==el.code))      //includes cannot be used in this case
        setStudyPlan({exist: true, courses:[...studyPlan.courses, course]});
}

//event in this scope should not be actually deprecated
function DropZoneTable(props){
    return(
    <Container onDragOver={(event)=>onDragOver(event)} onDrop={(event)=>onDrop(event,props.studyPlan,props.setStudyPlan)} className="h-100">
        <Accordion alwaysOpen>     
            {props.studyPlan.courses.length ? 
                props.studyPlan.courses.sort((a,b)=>a.name.localeCompare(b.name)).map((row)=> <CourseRow key={row.code}course={row} delete={true} deleteCourse={props.deleteCourse}> </CourseRow>) : 
                <Row key="dnd-alert"><Alert key="primary" variant="primary">Drag and drop a course here to add it to your Study Plan</Alert></Row>}
        </Accordion>
        <CreditsCounter  credits={props.credits} creditsRange={props.creditsRange}/>
        {props.error && <Alert dismissible key="danger" variant="danger" onClose={()=>{props.setError('')}}>Error: {props.error}</Alert>}
        {props.success && <Alert dismissible  key="success" variant="success" onClose={()=>{props.setSuccess(false)}}>StudyPlan saved!</Alert>}
        <Button type="link" variant="primary" onClick={props.savePlan}>Save StudyPlan</Button>{'  '}
        <Button type="link" variant="danger" onClick={props.deletePlan}>Delete StudyPlan</Button>{'  '}
        <Button type="link" variant="primary" onClick={props.resetPlan}>Reset Changes</Button>

    </Container>

    )
}

function SourceTable(props){
    return(
    <Accordion onDragOver={(event)=>onDragOver(event)} alwaysOpen >   
        {props.courses.length ? props.courses.sort((a,b)=>a.name.localeCompare(b.name)).map((row)=> <CourseRow key={row.code} course={row} delete={false} > </CourseRow>) : <h3 key="no-course-msg"> No courses yet </h3>}
    </Accordion>
    )
}


function CourseRow(props){
    const [collapsed, setCollapsed]=useState(true);
    const toggle= useAccordionButton(props.course.code,()=>{});
    
    return (
    <Container fluid draggable={props.course.available} onDragStart={(event)=>onDragStart(event, props.course)}>
        <Accordion.Item eventKey={props.course.code} >
            <div type="button" aria-expanded="false" className="accordion-button collapsed" onClick={()=>{toggle()}}> 
                <Container fluid>
                <Row className="align-self-center">
                    <Col className={props.delete ? "col-md-0 d-none d-sm-block":" d-none d-sm-block col-md-1"}>
                        {props.delete || <Grip className="me-4" fill="#D9D9D9" height={30} />}
                    </Col>
                    
                    <Col  className={props.delete?"col-md-12":" col-md-11"} style={{color: props.delete || props.course.available ? "black" : "grey"}}> 
                    <Row >
                        <Col md={10}>
                            <Row>
                                <b>{" Code: "+props.course.code  +", Name: "+props.course.name}</b>
                            </Row> 
                            <Row>
                                {" Credits: "+props.course.credits+", Max Students Allowed: "}{props.course.maxStudents?props.course.maxStudents:"No limit"}{", Already Subscribed: "+props.course.subscribedUsers}
                            </Row> 
                        </Col>
                        <Col md={1}>
                           {props.delete && <Button variant="outline-danger" size="sm" onClick={()=>{props.deleteCourse(props.course.code)}}>Delete</Button> }
                        </Col> 
                        </Row>
                    </Col>
                </Row>
                </Container>
            </div>
            <Accordion.Body >
                Incompatible with: {props.course.incompatibleWith.length ? "| "+props.course.incompatibleWith.map((el)=>el+" | "):"None | "} 
                Mandatory course required: {props.course.preparatoryCourse?props.course.preparatoryCourse:"None"}
                { !(props.delete || props.course.available) && <p style={{color:"red"}}> This course cannot be added to your Study Plan because: {props.course.availableReason} </p>}
            </Accordion.Body>
        </Accordion.Item>
    </Container>)
}

function CreditsCounter(props){
    const remaining=props.creditsRange.min-props.credits
    return(
        <Container>
            <Row className="mt-4 mb-3 align-items-center">
                <Col> <h3>Tot Credits: {props.credits}</h3></Col>
                <Col style={{color: (props.credits < props.creditsRange.min) ? "red" : "grey"   }}> Remaining credits: {props.credits < props.creditsRange.min? remaining : 0 } </Col>
                <Col>  Minimum: {props.creditsRange.min}</Col>
                <Col> Maximum: {props.creditsRange.max}</Col>
                
            </Row>
        </Container>
    )
}


function CourseTable(props){
    const [error, setError]=useState('');
    const [success, setSuccess]=useState(false)
    const [selectedPlan, setSelectedPlan]=useState('full')

    useEffect(()=>{props.setPlanType(selectedPlan);     //Used instead of createPlan call
    }, [selectedPlan])


    const deletePlan=()=>{
        props.setStudyPlan({exist:false, courses: []}); 
        props.setPlanType('')
        props.deleteStudyPlan();
        props.setCredits(0);
        setError('');
        setSuccess(false);
    }
    
    const deleteCourse=(code)=>{
        const dep=props.studyPlan.courses.filter((el)=>el.preparatoryCourse==code)
        if(dep.length){
            setError(`Course ${code} cannot be removed as course ${dep.code} requires it as preparatory exam. Delete ${dep.code} first.`);
            setSuccess(false);
        } else{
            setError('');
            const newSP=props.studyPlan.courses.filter((row)=>row.code!=code);
            let newCourses=JSON.parse(JSON.stringify(props.courses));
            newCourses=newCourses.map((el)=>{
                if(el.code==code){
                    el.subscribedUsers--;
                }
                return el;
            });
            props.setCourses(newCourses);

            props.setStudyPlan({exist: true, courses: newSP})
        }
    }

    //for some reasons when throwing an error its content do not reach the catch :^)
    const savePlan= async ()=>{
        try{
            if(props.credits<props.creditsRange.min){
                throw(`Your Study Plan does not include enough credits and it is below the minimum of ${props.creditsRange.min} credits`);
            }
            props.validatePlan();
            await props.saveStudyPlan().then(()=>{setSuccess(true); setError('');})
            setSuccess(true);
            setError('')
        } catch (err){
            setSuccess(false);
            setError(err)
        }
            
    }

    const resetPlan=async()=>{
        try{
            const newCourses=await props.getStudyPlan();
            props.setStudyPlan({exist:true,courses:newCourses});
        }catch(err){
            setError('Server Error');
        }
    }

   return (
    <Container fluid>
        <Row>
        <Col>
        <div>
            <h1> Our Courses</h1>
        </div>
        <div>
            <SourceTable courses={props.courses} studyPlan={props.logged ? props.studyPlan : false}/>
        </div>
        </Col>
        {props.logged ? 
            <Col> 
            {
                    props.studyPlan.exist ?   
                        <>
                            <div>
                                <h1> Your Study Plan </h1>
                            </div>
                            <div className='h-100'>
                                <DropZoneTable  studyPlan={props.studyPlan} 
                                                setStudyPlan={props.setStudyPlan}
                                                savePlan={savePlan} 
                                                resetPlan={resetPlan}
                                                deleteCourse={deleteCourse} 
                                                deletePlan={deletePlan}
                                                credits={props.credits} 
                                                creditsRange={props.creditsRange}
                                                error={error}
                                                success={success}
                                                setError={setError}
                                                setSuccess={setSuccess} />  
                            </div>
                        </>
                        :
                        <>   
                            <h2>Create your StudyPlan </h2>
                            <ListGroup defaultActiveKey={selectedPlan}>
                                <ListGroup.Item active={selectedPlan=='full'} action variant="primary" onClick={()=>{setSelectedPlan('full')}} >
                                    Full Time
                                </ListGroup.Item>
                                <ListGroup.Item active={selectedPlan=='part'} action variant="primary" onClick={()=>{setSelectedPlan('part')}} >
                                    Part Time
                                </ListGroup.Item>
                                <ListGroup.Item action onClick={()=>{props.createPlan(selectedPlan)}}>
                                    <b>Create Plan</b>
                                </ListGroup.Item>
                            </ListGroup>                                                
                        </>
                }
            </Col>
        : 
            <></>
        }
        </Row>
    </Container>
   )
}

 


export {Course, CourseTable};