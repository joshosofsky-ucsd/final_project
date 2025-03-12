let patientData = {};
let surgicalJourney = {
    pre: {
        heartRate: null,
        bloodPressure: null,
        oxygenSaturation: null,
        narrative: null
    },
    during: {
        heartRate: null,
        bloodPressure: null,
        oxygenSaturation: null,
        narrative: null
    },
    post: {
        heartRate: null,
        bloodPressure: null,
        oxygenSaturation: null,
        narrative: null
    }
};
let similarPatients = [];
let currentStage = 'pre';
let outcome = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded");
    initialize();
});

function initialize() {
    console.log("Initializing application");
    
    loadDataset();
    
    const patientForm = document.getElementById('patient-form');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const timelineSteps = document.querySelectorAll('.timeline-step');
    const restartBtn = document.getElementById('restart-btn');
    
    console.log("Patient form:", patientForm);
    
    if (patientForm) {
        patientForm.addEventListener('submit', function(event) {
            event.preventDefault();
            console.log("Form submitted");
            handleFormSubmit(event);
        });
    } else {
        console.error("Patient form not found!");
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', navigateToPreviousStage);
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', navigateToNextStage);
    }
    
    if (timelineSteps.length > 0) {
        timelineSteps.forEach(step => {
            step.addEventListener('click', function() {
                const stage = this.getAttribute('data-stage');
                if (this.classList.contains('completed') || 
                    (stage === 'during' && document.querySelector('[data-stage="pre"]').classList.contains('completed')) ||
                    (stage === 'post' && document.querySelector('[data-stage="during"]').classList.contains('completed'))) {
                    navigateToStage(stage);
                }
            });
        });
    }
    
    if (restartBtn) {
        restartBtn.addEventListener('click', restartJourney);
    }
    
    console.log('Surgical Journey Visualization initialized');
}

function handleFormSubmit(event) {
    console.log("Processing form submission");
    
    patientData = {
        age: parseInt(document.getElementById('age').value),
        sex: document.getElementById('sex').value,
        height: parseFloat(document.getElementById('height').value),
        weight: parseFloat(document.getElementById('weight').value),
        bmi: calculateBMI(parseFloat(document.getElementById('height').value), parseFloat(document.getElementById('weight').value)),
        asa: parseInt(document.getElementById('asa').value),
        department: document.getElementById('department').value,
        approach: document.getElementById('approach').value,
        ane_type: document.getElementById('ane_type').value,
        emop: false
    };
    
    console.log("Patient data collected:", patientData);
    console.log(`Found ${similarPatients.length} similar patients`);
    
    generateSurgicalJourney();
    startJourney();
}

function generateSurgicalJourney() {
    console.log("Generating surgical journey");

    surgicalJourney.pre.heartRate = simulateHeartRate(patientData, 'pre', similarPatients);
    surgicalJourney.pre.bloodPressure = simulateBloodPressure(patientData, 'pre');
    surgicalJourney.pre.oxygenSaturation = simulateOxygenSaturation(patientData, 'pre');
    surgicalJourney.pre.narrative = generateNarrative(patientData, {
        heartRate: surgicalJourney.pre.heartRate,
        bloodPressure: surgicalJourney.pre.bloodPressure,
        oxygenSaturation: surgicalJourney.pre.oxygenSaturation
    }, 'pre');
    
    surgicalJourney.during.heartRate = simulateHeartRate(patientData, 'during', similarPatients);
    surgicalJourney.during.bloodPressure = simulateBloodPressure(patientData, 'during');
    surgicalJourney.during.oxygenSaturation = simulateOxygenSaturation(patientData, 'during');
    surgicalJourney.during.narrative = generateNarrative(patientData, {
        heartRate: surgicalJourney.during.heartRate,
        bloodPressure: surgicalJourney.during.bloodPressure,
        oxygenSaturation: surgicalJourney.during.oxygenSaturation
    }, 'during');
    
    surgicalJourney.post.heartRate = simulateHeartRate(patientData, 'post', similarPatients);
    surgicalJourney.post.bloodPressure = simulateBloodPressure(patientData, 'post');
    surgicalJourney.post.oxygenSaturation = simulateOxygenSaturation(patientData, 'post');
    surgicalJourney.post.narrative = generateNarrative(patientData, {
        heartRate: surgicalJourney.post.heartRate,
        bloodPressure: surgicalJourney.post.bloodPressure,
        oxygenSaturation: surgicalJourney.post.oxygenSaturation
    }, 'post');
    
    outcome = determineSurgicalOutcome(patientData, similarPatients);
    
    console.log('Surgical journey generated', surgicalJourney);
    console.log('Outcome determined', outcome);
}

function startJourney() {
    console.log("Starting journey visualization");
    
    const inputSection = document.getElementById('input-section');
    const journeyContainer = document.getElementById('journey-container');
    
    if (inputSection && journeyContainer) {
        inputSection.style.display = 'none';
        journeyContainer.style.display = 'block';
        
        currentStage = 'pre';
        
        updateStageUI('pre');
        displayPatientSummary();

    } else {
        console.error("Could not find input section or journey container");
    }
}

function updateStageUI(stage) {
    console.log(`Updating UI for ${stage} stage`);
    
    const stages = document.querySelectorAll('.stage');
    
    stages.forEach(stageElem => {
        stageElem.classList.remove('active');
    });
    
    const currentStageElem = document.getElementById(`${stage}-op`);
    if (currentStageElem) {
        currentStageElem.classList.add('active');
    } else {
        console.error(`Stage element for ${stage} not found`);
    }
    
    updateTimeline(stage);
    updateNavigationButtons(stage);
    updateVitalSigns(stage);
    
    const notesElem = document.getElementById(`${stage}-op-notes`);
    if (notesElem) {
        notesElem.textContent = surgicalJourney[stage].narrative;
    }
    if (stage === 'during') {
        const progressBar = document.getElementById('surgery-progress');
        const progressTime = document.getElementById('progress-time');
        if (progressBar && progressTime) {
            animateSurgeryProgress();
        } else {
            console.log("Progress elements not found");
        }
    }
}

function updateTimeline(stage) {
    const timelineSteps = document.querySelectorAll('.timeline-step');
    
    timelineSteps.forEach(step => {
        step.classList.remove('active', 'completed');
    });
    
    const currentStep = document.querySelector(`.timeline-step[data-stage="${stage}"]`);
    if (currentStep) {
        currentStep.classList.add('active');
    }
    
    if (stage === 'during' || stage === 'post') {
        const preStep = document.querySelector('.timeline-step[data-stage="pre"]');
        if (preStep) {
            preStep.classList.add('completed');
        }
    }
    
    if (stage === 'post') {
        const duringStep = document.querySelector('.timeline-step[data-stage="during"]');
        if (duringStep) {
            duringStep.classList.add('completed');
        }
    }
}

function updateNavigationButtons(stage) {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    if (prevBtn) {
        prevBtn.disabled = (stage === 'pre');
    }
    
    if (nextBtn) {
        if (stage === 'post') {
            nextBtn.textContent = 'View Outcome';
        } else {
            nextBtn.textContent = 'Next';
        }
    }
}

function updateVitalSigns(stage) {
    console.log(`Updating vital signs for ${stage} stage`);
    
    // Update heart rate
    const heartRateElem = document.getElementById(`${stage}-heart-rate`);
    if (heartRateElem) {
        heartRateElem.textContent = `${surgicalJourney[stage].heartRate} bpm`;
        
        // Set color based on heart rate
        if (surgicalJourney[stage].heartRate > 100 || surgicalJourney[stage].heartRate < 60) {
            heartRateElem.style.color = '#f39c12';
        } else {
            heartRateElem.style.color = '#4cd137';
        }
    }
    
    const bpElem = document.getElementById(`${stage}-bp`);
    if (bpElem) {
        bpElem.textContent = `${surgicalJourney[stage].bloodPressure.systolic}/${surgicalJourney[stage].bloodPressure.diastolic} mmHg`;
        
        if (surgicalJourney[stage].bloodPressure.systolic > 140 || 
            surgicalJourney[stage].bloodPressure.systolic < 90 ||
            surgicalJourney[stage].bloodPressure.diastolic > 90 ||
            surgicalJourney[stage].bloodPressure.diastolic < 60) {
            bpElem.style.color = '#f39c12';
        } else {
            bpElem.style.color = '#4cd137';
        }
    }
    
    const spo2Elem = document.getElementById(`${stage}-spo2`);
    if (spo2Elem) {
        spo2Elem.textContent = `${surgicalJourney[stage].oxygenSaturation}%`;
        
        if (surgicalJourney[stage].oxygenSaturation < 94) {
            spo2Elem.style.color = '#f39c12';
            if (surgicalJourney[stage].oxygenSaturation < 90) {
                spo2Elem.style.color = '#e74c3c';
            }
        } else {
            spo2Elem.style.color = '#4cd137';
        }
    }

    createECGVisualization(stage);
}

function createECGVisualization(stage) {
    const ecgContainer = document.getElementById(`${stage}-ecg`);
    
    if (!ecgContainer) {
        console.error(`ECG container for ${stage} not found`);
        return;
    }
    
    ecgContainer.innerHTML = '';
    const ecgData = generateECGData(surgicalJourney[stage].heartRate);
    
    const margin = { top: 5, right: 5, bottom: 5, left: 5 };
    const width = ecgContainer.clientWidth - margin.left - margin.right;
    const height = ecgContainer.clientHeight - margin.top - margin.bottom;
    
    const svg = d3.select(`#${stage}-ecg`)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(ecgData, d => d[0])])
        .range([0, width]);
    
    const yScale = d3.scaleLinear()
        .domain([-1.2, 1.8])
        .range([height, 0]);
    
    const line = d3.line()
        .x(d => xScale(d[0]))
        .y(d => yScale(d[1]));
    
    svg.append('path')
        .datum(ecgData)
        .attr('fill', 'none')
        .attr('stroke', '#4cd137')
        .attr('stroke-width', 2)
        .attr('d', line);
    
    animateECG(svg, line, ecgData, xScale, yScale, width, height);
}


function animateECG(svg, line, data, xScale, yScale, width, height) {
    const animData = [...data];
    function animate() {

        const point = animData.shift();
        animData.push(point);
        svg.select('path')
            .datum(animData)
            .attr('d', line);
        
        if (svg.node() && svg.node().parentNode) {
            requestAnimationFrame(animate);
        }
    }
    
    requestAnimationFrame(animate);
}

function animateSurgeryProgress() {
    const progressBar = document.getElementById('surgery-progress');
    const progressTime = document.getElementById('progress-time');
    
    if (!progressBar || !progressTime) {
        console.error("Progress elements not found");
        return;
    }
    
    progressBar.style.width = '0%';
    
    let surgeryDuration = 7200;
    if (similarPatients.length > 0) {
        const avgDuration = similarPatients.reduce((sum, patient) => sum + (patient.surgery_duration || 0), 0) / similarPatients.length;
        surgeryDuration = avgDuration > 0 ? avgDuration * 60 : 7200;
    }
    
    const animationDuration = surgeryDuration / 60;
    const startTime = Date.now();
    
    function updateProgress() {
        const elapsedTime = (Date.now() - startTime) / 1000;
        const progress = Math.min(100, (elapsedTime / animationDuration) * 100);
        
        progressBar.style.width = `${progress}%`;
        
        const simulatedMinutes = Math.floor((progress / 100) * (surgeryDuration / 60));
        const hours = Math.floor(simulatedMinutes / 60);
        const minutes = simulatedMinutes % 60;
        
        progressTime.textContent = `Time elapsed: ${hours}:${minutes.toString().padStart(2, '0')}`;
        
        if (progress < 100 && document.getElementById('during-op').classList.contains('active')) {
            requestAnimationFrame(updateProgress);
        } else if (progress >= 100) {
            progressBar.style.width = '100%';
            progressTime.textContent = `Time elapsed: ${Math.floor(surgeryDuration / 3600)}:${Math.floor((surgeryDuration % 3600) / 60).toString().padStart(2, '0')}`;
        }
    }
    
    updateProgress();
}

function displayPatientSummary() {
    const summaryContainer = document.getElementById('patient-summary');
    if (!summaryContainer) {
        console.error("Patient summary container not found");
        return;
    }
    
    summaryContainer.innerHTML = '';
    
    const details = [
        { label: 'Age', value: `${patientData.age} years` },
        { label: 'Sex', value: patientData.sex === 'M' ? 'Male' : 'Female' },
        { label: 'Height', value: `${patientData.height} cm` },
        { label: 'Weight', value: `${patientData.weight} kg` },
        { label: 'BMI', value: patientData.bmi.toFixed(1) },
        { label: 'ASA Status', value: `ASA ${patientData.asa}` },
        { label: 'Department', value: patientData.department },
        { label: 'Approach', value: patientData.approach },
        { label: 'Anesthesia', value: patientData.ane_type }
    ];
    
    details.forEach(detail => {
        const detailElem = document.createElement('div');
        detailElem.className = 'patient-detail';
        detailElem.innerHTML = `<span class="detail-label">${detail.label}:</span> ${detail.value}`;
        summaryContainer.appendChild(detailElem);
    });

    if (currentStage === 'post') {
        updateRecoveryStatus();
    }
}

/**
 * Update the recovery status display
 */
function updateRecoveryStatus() {
    const recoveryStatus = document.getElementById('recovery-status');
    if (!recoveryStatus) {
        console.error("Recovery status container not found");
        return;
    }
    
    let statusHTML = '';
    
    if (outcome.survived) {
        statusHTML += '<div class="status-item positive">Surgery completed successfully</div>';
        statusHTML += `<div class="status-item">Estimated recovery time: ${outcome.recoveryTime} days</div>`;
        statusHTML += `<div class="status-item">Complication risk: ${outcome.complicationRisk}</div>`;
        
        if (outcome.longerHospitalStay) {
            statusHTML += '<div class="status-item warning">Extended hospital stay likely</div>';
        } else {
            statusHTML += '<div class="status-item positive">Standard hospital stay expected</div>';
        }
    } else {
        statusHTML += '<div class="status-item negative">Critical complications developed</div>';
        statusHTML += '<div class="status-item negative">Patient condition deteriorating</div>';
    }
    
    recoveryStatus.innerHTML = statusHTML;
}

/**
 * Navigate to the previous stage
 */
function navigateToPreviousStage() {
    if (currentStage === 'during') {
        navigateToStage('pre');
    } else if (currentStage === 'post') {
        navigateToStage('during');
    }
}

/**
 * Navigate to the next stage
 */
function navigateToNextStage() {
    if (currentStage === 'pre') {
        navigateToStage('during');
    } else if (currentStage === 'during') {
        navigateToStage('post');
    } else if (currentStage === 'post') {
        showOutcome();
    }
}

/**
 * Navigate to a specific stage
 * @param {string} stage - The stage to navigate to
 */
function navigateToStage(stage) {
    currentStage = stage;
    updateStageUI(stage);
}

/**
 * Determine surgical outcome based on patient data and similar cases from the dataset
 * @param {Object} patientData - The patient data
 * @param {Array} similarPatients - Similar patients from the dataset
 * @returns {Object} - Outcome information
 */
function determineSurgicalOutcome(patientData, similarPatients) {
    console.log("Determining surgical outcome based on", similarPatients.length, "similar patients");
    
    // Default outcome if no similar patients are found
    const outcome = {
        survived: true,
        recoveryTime: 5, // Default recovery time in days
        complicationRisk: 'Low',
        factors: [],
        longerHospitalStay: false,
        icuStay: false,
        icuDays: 0
    };
    
    // If we have similar patients, base outcome on their data
    if (similarPatients.length > 0) {
        // Calculate mortality rate from similar patients
        const deathCount = similarPatients.filter(patient => 
            patient.death_inhosp === 1 || 
            patient.mortality_label === "Died" || 
            patient.death_inhosp === true
        ).length;
        
        const mortalityRate = deathCount / similarPatients.length;
        console.log(`Mortality rate from similar patients: ${(mortalityRate * 100).toFixed(1)}%`);
        
        // Determine survival using weighted probability based on dataset
        const survivalProbability = 1 - mortalityRate;
        outcome.survived = Math.random() < survivalProbability;
        
        // Calculate average length of stay (recovery time)
        let totalLOS = 0;
        let validLOScount = 0;
        
        similarPatients.forEach(patient => {
            if (patient.los_postop !== null && 
                patient.los_postop !== undefined && 
                !isNaN(patient.los_postop) && 
                patient.los_postop > 0) {
                totalLOS += patient.los_postop;
                validLOScount++;
            }
        });
        
        if (validLOScount > 0) {
            outcome.recoveryTime = Math.round(totalLOS / validLOScount);
            console.log(`Average recovery time: ${outcome.recoveryTime} days`);
        } else {
            // Estimate based on surgery type if no valid LOS data
            outcome.recoveryTime = estimateRecoveryByDepartment(patientData.department, patientData.approach);
            console.log(`Estimated recovery time (no valid data): ${outcome.recoveryTime} days`);
        }
        
        // Calculate ICU stay
        let totalICUDays = 0;
        let validICUcount = 0;
        
        similarPatients.forEach(patient => {
            if (patient.icu_days !== null && 
                patient.icu_days !== undefined && 
                !isNaN(patient.icu_days) && 
                patient.icu_days > 0) {
                totalICUDays += patient.icu_days;
                validICUcount++;
            }
        });
        
        if (validICUcount > 0) {
            const avgICUDays = totalICUDays / validICUcount;
            outcome.icuStay = avgICUDays > 0;
            outcome.icuDays = Math.round(avgICUDays);
            console.log(`Average ICU stay: ${outcome.icuDays} days`);
        }
    } else {
        console.log("No similar patients found, using demographic-based estimates");
        // Without similar patients, use demographic risk factors
        let mortalityRisk = calculateMortalityRiskByDemographics(patientData);
        
        // Determine survival
        outcome.survived = Math.random() > mortalityRisk;
        
        // Estimate recovery time based on surgery complexity
        outcome.recoveryTime = estimateRecoveryByDepartment(patientData.department, patientData.approach);
        
        // Estimate ICU stay
        outcome.icuStay = patientData.asa >= 3 || patientData.department === "Thoracic surgery";
        if (outcome.icuStay) {
            outcome.icuDays = patientData.asa >= 3 ? patientData.asa - 1 : 1;
        }
    }
    
    // Determine complication risk and factors
    calculateComplicationRisk(patientData, outcome);
    
    // Add survivor-specific factors
    if (outcome.survived) {
        if (outcome.complicationRisk === 'Low') {
            outcome.factors.push('Low risk profile contributed to positive outcome');
        } else if (outcome.recoveryTime > 10) {
            outcome.factors.push('Extended hospital stay due to complex recovery');
        }
        
        if (outcome.icuStay) {
            outcome.factors.push(`Required ${outcome.icuDays} ${outcome.icuDays === 1 ? 'day' : 'days'} in intensive care unit`);
        }
    } else {
        outcome.factors.push('Multiple risk factors contributed to negative outcome');
        
        if (patientData.asa >= 3) {
            outcome.factors.push('Pre-existing severe health conditions increased mortality risk');
        }
    }
    
    return outcome;
}

/**
 * Calculate estimated mortality risk based on demographics and procedure
 * @param {Object} patientData - Patient demographic and procedure data
 * @returns {number} - Estimated mortality risk (0-1)
 */
function calculateMortalityRiskByDemographics(patientData) {
    let mortalityRisk = 0.01; // Base risk of 1%
    
    // Age risk (increases exponentially with age)
    if (patientData.age > 80) mortalityRisk += 0.04;
    else if (patientData.age > 70) mortalityRisk += 0.025;
    else if (patientData.age > 60) mortalityRisk += 0.015;
    
    // ASA risk (major factor in mortality)
    mortalityRisk += (patientData.asa - 1) * 0.015;
    
    // Department risk
    if (patientData.department === "Thoracic surgery") mortalityRisk += 0.01;
    
    // Approach risk
    if (patientData.approach === "Open") mortalityRisk += 0.01;
    
    // BMI risk
    if (patientData.bmi > 35 || patientData.bmi < 18.5) mortalityRisk += 0.01;
    
    // Emergency surgery risk (not used in this implementation)
    if (patientData.emop) mortalityRisk += 0.03;
    
    console.log(`Calculated mortality risk: ${(mortalityRisk * 100).toFixed(1)}%`);
    return mortalityRisk;
}

/**
 * Estimate recovery time based on department and approach
 * @param {string} department - Surgical department
 * @param {string} approach - Surgical approach
 * @returns {number} - Estimated recovery days
 */
function estimateRecoveryByDepartment(department, approach) {
    // Base recovery time by department
    let recoveryDays = 5; // Default
    
    switch (department) {
        case "General surgery":
            recoveryDays = 7;
            break;
        case "Thoracic surgery":
            recoveryDays = 10;
            break;
        case "Gynecology":
            recoveryDays = 5;
            break;
        case "Urology":
            recoveryDays = 4;
            break;
    }
    
    // Adjust based on approach
    switch (approach) {
        case "Open":
            recoveryDays *= 1.5; // 50% longer for open surgery
            break;
        case "Videoscopic":
            recoveryDays *= 0.8; // 20% shorter for minimally invasive
            break;
        case "Robotic":
            recoveryDays *= 0.7; // 30% shorter for robotic
            break;
    }
    
    return Math.round(recoveryDays);
}

/**
 * Calculate complication risk and add factors to outcome
 * @param {Object} patientData - The patient data
 * @param {Object} outcome - The outcome object to modify
 */
function calculateComplicationRisk(patientData, outcome) {
    let complicationScore = 0;
    
    // Age factor
    if (patientData.age > 75) {
        complicationScore += 3;
        outcome.factors.push('Advanced age significantly increases risk');
    } else if (patientData.age > 65) {
        complicationScore += 2;
        outcome.factors.push('Advanced age increases complication risk');
    }
    
    // ASA factor
    if (patientData.asa >= 3) {
        complicationScore += 3;
        outcome.factors.push('Higher ASA physical status associated with increased risk');
    }
    
    // BMI factor
    if (patientData.bmi > 35) {
        complicationScore += 3;
        outcome.factors.push('Obesity (BMI > 35) increases complication risk');
    } else if (patientData.bmi > 30) {
        complicationScore += 2;
        outcome.factors.push('Elevated BMI associated with increased complication risk');
    } else if (patientData.bmi < 18.5) {
        complicationScore += 1;
        outcome.factors.push('Low BMI may impact recovery');
    }
    
    // Surgery type factor
    if (patientData.department === 'Thoracic surgery') {
        complicationScore += 2;
        outcome.factors.push('Thoracic procedures have higher complication rates');
    }
    
    // Approach factor
    if (patientData.approach === 'Open') {
        complicationScore += 1;
        outcome.factors.push('Open surgical approach typically requires longer recovery');
    } else if (patientData.approach === 'Robotic') {
        complicationScore -= 1;
        outcome.factors.push('Robotic approach may reduce complications');
    }
    
    // Set complication risk based on score
    if (complicationScore >= 6) {
        outcome.complicationRisk = 'Very High';
    } else if (complicationScore >= 4) {
        outcome.complicationRisk = 'High';
    } else if (complicationScore >= 2) {
        outcome.complicationRisk = 'Moderate';
    }
    
    // Determine if hospital stay might be longer than typical
    outcome.longerHospitalStay = complicationScore >= 3;
}

/**
 * Show the surgical outcome
 * Updated to remove average hospital stay from dataset statistics
 */
function showOutcome() {
    console.log("Showing outcome", outcome);

    const stagesContainer = document.querySelector('.stages');
    const navigationContainer = document.querySelector('.navigation');
    const outcomeContainer = document.getElementById('outcome-container');

    if (!stagesContainer || !navigationContainer || !outcomeContainer) {
        console.error("Required containers not found");
        return;
    }

    // Hide the stages and show the outcome container
    stagesContainer.style.display = 'none';
    navigationContainer.style.display = 'none';
    outcomeContainer.style.display = 'block';

    // Update outcome status
    const outcomeStatus = document.getElementById('outcome-status');
    if (outcomeStatus) {
        if (outcome.survived) {
            outcomeStatus.innerHTML = '<div class="outcome-positive">Surgery Successful</div>';
            outcomeStatus.innerHTML += `
                <p class="outcome-detail">The patient recovered well with a hospital stay of ${outcome.recoveryTime} days.</p>
                <p class="outcome-detail">Complication Risk: <span class="${outcome.complicationRisk.toLowerCase().replace(' ', '-')}">${outcome.complicationRisk}</span></p>
            `;

            if (outcome.icuStay) {
                outcomeStatus.innerHTML += `
                    <p class="outcome-detail">ICU Stay Required: ${outcome.icuDays} ${outcome.icuDays === 1 ? 'day' : 'days'}</p>
                `;
            }
        } else {
            outcomeStatus.innerHTML = '<div class="outcome-negative">Surgery Unsuccessful</div>';
            outcomeStatus.innerHTML += `
                <p class="outcome-detail">Despite medical intervention, the patient experienced critical complications leading to mortality.</p>
                <p class="outcome-detail">This outcome occurred in approximately ${(calculateMortalityRate(similarPatients) * 100).toFixed(1)}% 
                of similar cases in the dataset.</p>
            `;
        }
    }

    // Display outcome factors
    const factorsContainer = document.getElementById('outcome-factors');
    if (factorsContainer) {
        factorsContainer.innerHTML = '<h3>Key Factors</h3>';

        outcome.factors.forEach(factor => {
            const factorElem = document.createElement('div');
            factorElem.className = 'factor';
            factorElem.textContent = factor;
            factorsContainer.appendChild(factorElem);
        });

        // Add dataset statistics (without average hospital stay)
        factorsContainer.innerHTML += `
            <h3 class="dataset-stats-title">Dataset Statistics</h3>
            <div class="dataset-stats">
                <p>Based on ${similarPatients.length} similar patients in the Korean healthcare dataset</p>
                <p>Overall mortality rate in similar cases: ${(calculateMortalityRate(similarPatients) * 100).toFixed(1)}%</p>
            </div>
        `;
    }

    // Add similar patient outcome visualizations
    if (similarPatients.length > 0) {
        createSimilarPatientVisualizations(similarPatients, outcomeContainer);
    }
}

function createSimilarPatientVisualizations(similarPatients, outcomeContainer) {
    // Create container for visualizations
    const visualizationsSection = document.createElement('div');
    visualizationsSection.className = 'outcome-visualizations';
    visualizationsSection.innerHTML = '<h3>Similar Patient Outcomes</h3>';
    
    // Add the visualization containers
    visualizationsSection.innerHTML += `
        <div class="visualization-row">
            <div class="visualization-container">
                <h4>Mortality Rate</h4>
                <div id="mortality-chart"></div>
            </div>
            <div class="visualization-container">
                <h4>Length of Stay Distribution</h4>
                <div id="los-chart"></div>
            </div>
        </div>
        <div class="visualization-row">
            <div class="visualization-container">
                <h4>Outcomes by Age Group</h4>
                <div id="age-outcomes-chart"></div>
            </div>
            <div class="visualization-container">
                <h4>Mortality Rate by ASA Status</h4>
                <div id="asa-outcomes-chart"></div>
            </div>
        </div>
    `;
    
    outcomeContainer.appendChild(visualizationsSection);
    
    createMortalityChart(similarPatients);
    createLengthOfStayChart(similarPatients);
    createAgeOutcomesChart(similarPatients);
    createAsaOutcomesChart(similarPatients);
}


function createMortalityChart(patients) {
    if (!patients || patients.length === 0) return;
    
    const survived = patients.filter(p => 
        p.death_inhosp !== 1 && 
        p.mortality_label !== "Died" && 
        p.death_inhosp !== true
    ).length;
    
    const died = patients.length - survived;
    
    const data = [
        {label: 'Survived', value: survived, color: '#4cd137'},
        {label: 'Deceased', value: died, color: '#e74c3c'}
    ];
    
    const width = 200;
    const height = 200;
    const radius = Math.min(width, height) / 2;
    
    const svg = d3.select('#mortality-chart')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width/2}, ${height/2})`);
    
    const pie = d3.pie()
        .value(d => d.value)
        .sort(null);
    
    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius - 10);
    
    const slices = svg.selectAll('path')
        .data(pie(data))
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', d => d.data.color);
    
    svg.selectAll('text')
        .data(pie(data))
        .enter()
        .append('text')
        .attr('transform', d => `translate(${arc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .attr('dy', '.35em')
        .text(d => {
            const percentage = ((d.data.value / patients.length) * 100).toFixed(1);
            return percentage > 5 ? `${percentage}%` : '';
        })
        .style('fill', '#fff')
        .style('font-weight', 'bold');
    
    const legend = d3.select('#mortality-chart')
        .append('div')
        .attr('class', 'chart-legend');
    
    data.forEach(item => {
        const legendItem = legend.append('div')
            .attr('class', 'legend-item');
        
        legendItem.append('span')
            .attr('class', 'legend-color')
            .style('background-color', item.color);
        
        legendItem.append('span')
            .text(`${item.label} (${item.value})`);
    });
}


function createLengthOfStayChart(similarPatients) {
}

function createAgeOutcomesChart(similarPatients) {
    if (!similarPatients || similarPatients.length === 0) return;

    const ageGroups = {
        "Under 50": { survived: 0, died: 0 },
        "50-65": { survived: 0, died: 0 },
        "66-75": { survived: 0, died: 0 },
        "Over 75": { survived: 0, died: 0 }
    };

    similarPatients.forEach(p => {
        let ageGroup;
        if (p.age < 50) ageGroup = "Under 50";
        else if (p.age <= 65) ageGroup = "50-65";
        else if (p.age <= 75) ageGroup = "66-75";
        else ageGroup = "Over 75";

        const died = p.death_inhosp === 1 || p.mortality_label === "Died" || p.death_inhosp === true;

        if (died) ageGroups[ageGroup].died++;
        else ageGroups[ageGroup].survived++;
    });

    const data = Object.entries(ageGroups).map(([ageGroup, counts]) => {
        const total = counts.survived + counts.died;
        return {
            ageGroup,
            survived: counts.survived,
            died: counts.died,
            total: total,
            survivedPct: total > 0 ? (counts.survived / total * 100).toFixed(1) : 0,
            diedPct: total > 0 ? (counts.died / total * 100).toFixed(1) : 0
        };
    });

    const margin = { top: 20, right: 10, bottom: 30, left: 40 };
    const width = 200 - margin.left - margin.right;
    const height = 180 - margin.top - margin.bottom;

    const svg = d3.select('#age-outcomes-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand()
        .domain(data.map(d => d.ageGroup))
        .range([0, width])
        .padding(0.2);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.survived + d.died)])
        .range([height, 0]);


    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .style('font-size', '8px');

    svg.append('g')
        .call(d3.axisLeft(yScale));

    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - margin.left - 3)
        .attr('x', 0 - (height / 2))
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .style('font-size', '10px')
        .text('Number of Patients');

    // Draw died bars (red)
    svg.selectAll('.died-bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'died-bar')
        .attr('x', d => xScale(d.ageGroup))
        .attr('width', xScale.bandwidth())
        .attr('y', d => yScale(d.died + d.survived))
        .attr('height', d => height - yScale(d.died))
        .attr('fill', '#e74c3c');

    // Draw survived bars (green)
    svg.selectAll('.survived-bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'survived-bar')
        .attr('x', d => xScale(d.ageGroup))
        .attr('width', xScale.bandwidth())
        .attr('y', d => yScale(d.survived))
        .attr('height', d => d.survived > 0 ? height - yScale(d.survived) : 0)
        .attr('fill', '#4cd137');


    svg.selectAll('.combined-label')
        .data(data)
        .enter()
        .append('text')
        .attr('class', 'count-label')
        .attr('x', d => xScale(d.ageGroup) + xScale.bandwidth() / 2)
        .attr('y', d => yScale(d.died + d.survived) - 5)
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .style('font-size', '9px')
        .text(d => {
            if (d.survived > 0 && d.died > 0) {
                return `${d.survived} / ${d.died}`;
            } else if (d.survived > 0) {
                return `${d.survived}`;
            } else if (d.died > 0) {
                return `${d.died}`;
            } else {
                return '';
            }
        });
    const legend = d3.select('#age-outcomes-chart')
        .append('div')
        .attr('class', 'chart-legend');

    const legendItems = [
        { label: 'Survived', color: '#4cd137' },
        { label: 'Deceased', color: '#e74c3c' }
    ];

    legendItems.forEach(item => {
        const legendItem = legend.append('div')
            .attr('class', 'legend-item');

        legendItem.append('span')
            .attr('class', 'legend-color')
            .style('background-color', item.color);

        legendItem.append('span')
            .text(item.label);
    });
}

function createAsaOutcomesChart(similarPatients) {
    if (!similarPatients || similarPatients.length === 0) return;

    const asaGroups = {
        1: {survived: 0, died: 0},
        2: {survived: 0, died: 0},
        3: {survived: 0, died: 0},
        4: {survived: 0, died: 0},
        5: {survived: 0, died: 0}
    };
    
    similarPatients.forEach(p => {
        let asaValue = p.asa;
        if (!asaValue || asaValue < 1 || asaValue > 5) return;
        
        const died = p.death_inhosp === 1 || p.mortality_label === "Died" || p.death_inhosp === true;
        
        if (died) asaGroups[asaValue].died++;
        else asaGroups[asaValue].survived++;
    });
    
    const data = Object.entries(asaGroups).map(([asa, counts]) => {
        const total = counts.survived + counts.died;
        return {
            asa: `ASA ${asa}`,
            survived: counts.survived,
            died: counts.died,
            total: total,
            mortalityRate: total > 0 ? counts.died / total : 0
        };
    }).filter(d => d.total > 0);
    
    const margin = {top: 20, right: 10, bottom: 30, left: 40};
    const width = 200 - margin.left - margin.right;
    const height = 180 - margin.top - margin.bottom;
    
    const svg = d3.select('#asa-outcomes-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Set up scales
    const xScale = d3.scaleBand()
        .domain(data.map(d => d.asa))
        .range([0, width])
        .padding(0.2);
    
    const yScale = d3.scaleLinear()
        .domain([0, 1])
        .range([height, 0]);
    
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale));
    
    svg.append('g')
        .call(d3.axisLeft(yScale)
            .tickFormat(d => `${(d * 100).toFixed(0)}%`));
    
    svg.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => xScale(d.asa))
        .attr('width', xScale.bandwidth())
        .attr('y', d => yScale(d.mortalityRate))
        .attr('height', d => height - yScale(d.mortalityRate))
        .attr('fill', d => d.mortalityRate > 0.2 ? '#e74c3c' : '#f39c12');
    
    // Add labels
    svg.selectAll('.bar-label')
        .data(data)
        .enter()
        .append('text')
        .attr('class', 'bar-label')
        .attr('x', d => xScale(d.asa) + xScale.bandwidth() / 2)
        .attr('y', d => yScale(d.mortalityRate) - 5)
        .attr('text-anchor', 'middle')
        .text(d => `${(d.mortalityRate * 100).toFixed(1)}%`)
        .style('font-size', '9px');
}

function calculateMortalityRiskByDemographics(patientData) {
    let mortalityRisk = 0.01;

    if (patientData.age > 80) mortalityRisk += 0.04;
    else if (patientData.age > 70) mortalityRisk += 0.025;
    else if (patientData.age > 60) mortalityRisk += 0.015;

    mortalityRisk += (patientData.asa - 1) * 0.015;

    if (patientData.department === "Thoracic surgery") mortalityRisk += 0.01;

    if (patientData.approach === "Open") mortalityRisk += 0.01;

    if (patientData.bmi > 35 || patientData.bmi < 18.5) mortalityRisk += 0.01;

    if (patientData.emop) mortalityRisk += 0.03;

    console.log(`Calculated mortality risk: ${(mortalityRisk * 100).toFixed(1)}%`);
    return mortalityRisk;
}

function calculateMortalityRate(patients) {
    if (!patients || patients.length === 0) return 0;
    
    const deathCount = patients.filter(patient => 
        patient.death_inhosp === 1 || 
        patient.mortality_label === "Died" || 
        patient.death_inhosp === true
    ).length;
    
    return deathCount / patients.length;
}

function calculateAverageLOS(patients) {
    if (!patients || patients.length === 0) return "N/A";
    
    let totalLOS = 0;
    let validLOScount = 0;
    
    patients.forEach(patient => {
        if (patient.los_postop !== null && 
            patient.los_postop !== undefined && 
            !isNaN(patient.los_postop) && 
            patient.los_postop > 0) {
            totalLOS += patient.los_postop;
            validLOScount++;
        }
    });
    
    if (validLOScount > 0) {
        return (totalLOS / validLOScount).toFixed(1);
    } else {
        return "N/A";
    }
}

function restartJourney() {
    console.log("Restarting journey");
    
    // The simplest and most reliable way to restart is to reload the page
    window.location.reload();
}
/**
 * Initialize multi-step form navigation and events
 * Updated version with robust event listener management
 */
function initializeMultiStepForm() {
    console.log("Initializing multi-step form");
    
    // Step navigation
    setupStepNavigation();
    
    // Start journey button - with proper event listener cleanup
    const startJourneyBtn = document.getElementById('start-journey-btn');
    if (startJourneyBtn) {
        // Remove old listeners if any
        const newBtn = startJourneyBtn.cloneNode(true);
        startJourneyBtn.parentNode.replaceChild(newBtn, startJourneyBtn);
        
        // Add fresh listener
        newBtn.addEventListener('click', function() {
            console.log("Start journey button clicked");
            navigateToStep('age-section');
        });
    }
    
    // Dynamic content generation
    setupDepartmentSection();
    setupApproachSection();
    setupAnesthesiaSection();
    setupASASection();
    
    // Final submit button - with proper event listener cleanup
    const beginVisualizationBtn = document.getElementById('begin-visualization-btn');
    if (beginVisualizationBtn) {
        // Remove old listeners if any
        const newBtn = beginVisualizationBtn.cloneNode(true);
        beginVisualizationBtn.parentNode.replaceChild(newBtn, beginVisualizationBtn);
        
        // Add fresh listener
        newBtn.addEventListener('click', function() {
            console.log("Begin visualization button clicked");
            processFormData();
        });
    }
}

/**
 * Navigate to a specific step - with better error handling
 * @param {string} stepId - The ID of the step to navigate to
 */
function navigateToStep(stepId) {
    console.log(`Navigating to step: ${stepId}`);
    
    // Validate step exists
    const targetStep = document.getElementById(stepId);
    if (!targetStep) {
        console.error(`Step not found: ${stepId}`);
        return;
    }
    
    // Hide all steps
    const allSteps = document.querySelectorAll('.step-section');
    allSteps.forEach(step => {
        step.classList.remove('active');
        step.style.display = 'none';
    });
    
    // Show the target step
    targetStep.classList.add('active');
    targetStep.style.display = 'block';
    window.scrollTo(0, 0);
    
    // Special case for department step
    if (stepId === 'department-section') {
        updateDepartmentOptions();
    }
    
    // Update patient summary in final step
    if (stepId === 'summary-section') {
        updatePatientSummary();
    }
}

/**
 * Department-specific data constraints based on the dataset
 */
const departmentConstraints = {
    "General surgery": {
        sex: ["M", "F"],
        approach: ["Open", "Videoscopic", "Robotic"],
        anesthesia: ["General", "Spinal", "Sedation"],
        stats: {
            malePercentage: 51.2,
            ageRange: "59 (48-68)",
            heightRange: "162 (156-169)",
            weightRange: "60 (53-69)",
            approaches: {
                Open: 63.0,
                Videoscopic: 34.2,
                Robotic: 2.7
            },
            anesthesia: {
                General: 93.9,
                Spinal: 5.0,
                Sedation: 1.1
            }
        }
    },
    "Thoracic surgery": {
        sex: ["M", "F"],
        approach: ["Open", "Videoscopic", "Robotic"],
        anesthesia: ["General", "Sedation"],
        stats: {
            malePercentage: 55.6,
            ageRange: "61 (52-70)",
            heightRange: "163 (156-169)",
            weightRange: "61 (54-69)",
            approaches: {
                Open: 17.1,
                Videoscopic: 80.0,
                Robotic: 2.9
            },
            anesthesia: {
                General: 98.4,
                Spinal: 0.0,
                Sedation: 1.6
            }
        }
    },
    "Gynecology": {
        sex: ["F"],
        approach: ["Open", "Videoscopic", "Robotic"],
        anesthesia: ["General", "Spinal"],
        stats: {
            malePercentage: 0.0,
            ageRange: "45 (35-55)",
            heightRange: "159 (155-163)",
            weightRange: "59 (53-66)",
            approaches: {
                Open: 28.3,
                Videoscopic: 60.9,
                Robotic: 10.9
            },
            anesthesia: {
                General: 88.3,
                Spinal: 11.7,
                Sedation: 0.0
            }
        }
    },
    "Urology": {
        sex: ["M", "F"],
        approach: ["Open", "Videoscopic", "Robotic"],
        anesthesia: ["General"],
        stats: {
            malePercentage: 86.3,
            ageRange: "64 (58-72)",
            heightRange: "168 (161-173)",
            weightRange: "69 (62-77)",
            approaches: {
                Open: 5.1,
                Videoscopic: 29.1,
                Robotic: 65.8
            },
            anesthesia: {
                General: 100.0,
                Spinal: 0.0,
                Sedation: 0.0
            }
        }
    }
};

/**
 * Initialize form events for dynamic selection options
 */
function initializeFormEvents() {
    const departmentSelect = document.getElementById('department');
    const sexSelect = document.getElementById('sex');
    const approachSelect = document.getElementById('approach');
    const anesthesiaSelect = document.getElementById('ane_type');
    const feetSelect = document.getElementById('feet');
    const inchesSelect = document.getElementById('inches');
    const weightLbInput = document.getElementById('weight-lb');
    const patientForm = document.getElementById('patient-form');
    
    // Set up unit conversion on form submission
    if (patientForm) {
        patientForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            // Convert height from feet/inches to cm
            const feet = parseInt(feetSelect.value) || 0;
            const inches = parseInt(inchesSelect.value) || 0;
            const heightCm = convertHeightToCm(feet, inches);
            document.getElementById('height').value = heightCm;
            
            // Convert weight from lb to kg
            const weightLb = parseFloat(weightLbInput.value) || 0;
            const weightKg = convertWeightToKg(weightLb);
            document.getElementById('weight').value = weightKg;
            
            // Process the form submission
            handleFormSubmit(event);
        });
    }
    
    // Update available options when department changes
    if (departmentSelect) {
        departmentSelect.addEventListener('change', function() {
            const department = this.value;
            updateDepartmentOptions(department, sexSelect, approachSelect, anesthesiaSelect);
        });
    }
    
    // Add event listener for sex selection in case of Gynecology
    if (sexSelect) {
        sexSelect.addEventListener('change', function() {
            const department = departmentSelect.value;
            if (department === 'Gynecology' && this.value === 'M') {
                alert('Note: The dataset only includes female patients for Gynecology department.');
            }
        });
    }
}

/**
 * Update available options based on selected department
 */
function updateDepartmentOptions(department, sexSelect, approachSelect, anesthesiaSelect) {
    if (!department) {
        resetSelects(approachSelect, anesthesiaSelect);
        return;
    }
    
    const constraints = departmentConstraints[department];
    if (!constraints) {
        console.error(`No constraints found for department: ${department}`);
        return;
    }
    
    // Update approach options
    if (approachSelect) {
        approachSelect.innerHTML = '<option value="">Select...</option>';
        constraints.approach.forEach(approach => {
            const percentage = constraints.stats.approaches[approach];
            const option = document.createElement('option');
            option.value = approach;
            option.textContent = `${approach} (${percentage}%)`;
            approachSelect.appendChild(option);
        });
    }
    
    // Update anesthesia options
    if (anesthesiaSelect) {
        anesthesiaSelect.innerHTML = '<option value="">Select...</option>';
        constraints.anesthesia.forEach(anesthesia => {
            const percentage = constraints.stats.anesthesia[anesthesia];
            const option = document.createElement('option');
            option.value = anesthesia;
            option.textContent = `${anesthesia} (${percentage}%)`;
            anesthesiaSelect.appendChild(option);
        });
    }
    
    // If Gynecology is selected, force female sex
    if (department === 'Gynecology' && sexSelect) {
        sexSelect.value = 'F';
        sexSelect.disabled = true;
    } else if (sexSelect) {
        sexSelect.disabled = false;
    }
}

/**
 * Reset select elements to default state
 */
function resetSelects(...selects) {
    selects.forEach(select => {
        if (select) {
            select.innerHTML = '<option value="">Select Department First</option>';
        }
    });
}

/**
 * Convert height from feet and inches to centimeters
 * @param {number} feet - Height in feet
 * @param {number} inches - Additional inches
 * @returns {number} - Height in centimeters
 */
function convertHeightToCm(feet, inches) {
    const totalInches = (feet * 12) + inches;
    const cm = totalInches * 2.54;
    return Math.round(cm * 10) / 10; // Round to 1 decimal place
}

/**
 * Convert weight from pounds to kilograms
 * @param {number} lb - Weight in pounds
 * @returns {number} - Weight in kilograms
 */
function convertWeightToKg(lb) {
    const kg = lb * 0.45359237;
    return Math.round(kg * 10) / 10; // Round to 1 decimal place
}

// Update the initialize function to include our new form events
function initialize() {
    console.log("Initializing application");
    
    // Load the dataset
    loadDataset();
    
    // Initialize form events
    initializeFormEvents();
    
    // ... rest of the original initialize function
    const patientForm = document.getElementById('patient-form');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const timelineSteps = document.querySelectorAll('.timeline-step');
    const restartBtn = document.getElementById('restart-btn');
    
    console.log("Patient form:", patientForm);
    
    if (prevBtn) {
        prevBtn.addEventListener('click', navigateToPreviousStage);
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', navigateToNextStage);
    }
    
    // Set up timeline step navigation
    if (timelineSteps.length > 0) {
        timelineSteps.forEach(step => {
            step.addEventListener('click', function() {
                const stage = this.getAttribute('data-stage');
                if (this.classList.contains('completed') || 
                    (stage === 'during' && document.querySelector('[data-stage="pre"]').classList.contains('completed')) ||
                    (stage === 'post' && document.querySelector('[data-stage="during"]').classList.contains('completed'))) {
                    navigateToStage(stage);
                }
            });
        });
    }
    
    // Set up restart button
    if (restartBtn) {
        restartBtn.addEventListener('click', restartJourney);
    }
    
    console.log('Surgical Journey Visualization initialized');
}

// Update the handleFormSubmit function to use our hidden fields
function handleFormSubmit(event) {
    console.log("Processing form submission");
    
    // Get values from the form
    const heightInput = document.getElementById('height');
    const weightInput = document.getElementById('weight');
    
    // Collect form data
    patientData = {
        age: parseInt(document.getElementById('age').value),
        sex: document.getElementById('sex').value,
        height: parseFloat(heightInput.value),
        weight: parseFloat(weightInput.value),
        bmi: calculateBMI(parseFloat(heightInput.value), parseFloat(weightInput.value)),
        asa: parseInt(document.getElementById('asa').value),
        department: document.getElementById('department').value,
        approach: document.getElementById('approach').value.split(' ')[0], // Remove percentage info
        ane_type: document.getElementById('ane_type').value.split(' ')[0], // Remove percentage info
        emop: false // Assuming non-emergency for simplicity
    };
    
    console.log("Patient data collected:", patientData);
    
    // Find similar patients
    similarPatients = findSimilarPatients(patientData);
    console.log(similarPatients);
    console.log(`Found ${similarPatients.length} similar patients`);
    
    // Generate the surgical journey
    generateSurgicalJourney();
    
    // Start the visualization
    startJourney();
}
/**
 * Multi-step form navigation and data collection
 * Add this code to your main.js file
 */

// Content definitions for the dynamic elements
const departmentDescriptions = {
    "General surgery": {
        title: "General Surgery",
        description: "General surgery encompasses a wide range of procedures, including abdominal surgeries such as gastrointestinal procedures, appendectomy, and gallbladder removal; hernia repairs; and various tumor removals. In our dataset, these procedures represent the majority (77.2%) of the surgical cases.",
        stats: "4,930 cases (77.2% of dataset)"
    },
    "Thoracic surgery": {
        title: "Thoracic Surgery",
        description: "Thoracic surgery includes operations on the lungs, esophagus, and other structures within the chest cavity. These surgeries often involve video-assisted techniques and may be performed to treat lung cancer, esophageal disorders, or other thoracic conditions.",
        stats: "1,111 cases (17.4% of dataset)"
    },
    "Gynecology": {
        title: "Gynecology",
        description: "Gynecological surgery involves procedures on the female reproductive system, including hysterectomy, ovarian cyst removal, and procedures to address gynecological cancers. These surgeries are performed exclusively on female patients.",
        stats: "230 cases (3.6% of dataset)"
    },
    "Urology": {
        title: "Urology",
        description: "Urologic surgery encompasses procedures on the urinary tract and male reproductive organs. This includes prostate surgeries, kidney procedures, and bladder operations. In our dataset, the majority (86.3%) of urologic patients were male.",
        stats: "117 cases (1.8% of dataset)"
    }
};

const approachDescriptions = {
    "Open": {
        title: "Open Surgery",
        description: "Open surgery involves making a larger incision to directly access the surgical site. This traditional approach allows the surgeon full direct visualization and manual access to the organs. Recovery time is typically longer than with minimally invasive approaches.",
        stats: "3285 cases (52.6% of dataset)"
    },
    "Videoscopic": {
        title: "Videoscopic Surgery",
        description: "Videoscopic surgery (laparoscopy/thoracoscopy) involves making several small incisions and using a camera and specialized instruments to perform the procedure. This minimally invasive approach typically results in less pain, smaller scars, and faster recovery than open surgery.",
        stats: "2692 cases (43.1% of dataset)"
    },
    "Robotic": {
        title: "Robotic Surgery",
        description: "Robotic surgery uses a robotic system controlled by the surgeon to perform precise, minimally invasive procedures. The robotic arms provide enhanced dexterity and control compared to standard laparoscopic instruments, allowing for complex procedures to be performed through small incisions.",
        stats: "264 cases (4.2% of dataset)"
    }
};

const anesthesiaDescriptions = {
    "General": {
        title: "General Anesthesia",
        description: "General anesthesia involves complete loss of consciousness, sensation, and movement. Medication is administered intravenously and/or through inhalation gases. The patient is typically intubated to maintain the airway during surgery. This is the most common type of anesthesia for major surgeries.",
        stats: "5913 cases (94.7% of dataset)"
    },
    "Spinal": {
        title: "Spinal Anesthesia",
        description: "Spinal anesthesia involves injecting anesthetic medication into the fluid surrounding the spinal cord, numbing the lower half of the body. The patient remains awake but feels no sensation in the numbed area. This type is commonly used for procedures below the waistline.",
        stats: "258 cases (4.1% of dataset)"
    },
    "Sedation": {
        title: "Sedation",
        description: "Sedation (sometimes called 'twilight anesthesia') involves administering medication to make the patient drowsy and relaxed but not completely unconscious. Different levels of sedation can be used depending on the procedure. This is typically used for less invasive procedures.",
        stats: "70 cases (1.1% of dataset)"
    }
};

// Global variable to store all patient data
let patientFormData = {
    age: null,
    sex: null,
    height: null,
    weight: null,
    bmi: null,
    department: null,
    approach: null,
    ane_type: null,
    asa: null
};

/**
 * Initialize multi-step form navigation and events
 */
function initializeMultiStepForm() {
    console.log("Initializing multi-step form");
    
    // Step navigation
    setupStepNavigation();
    
    // Start journey button
    const startJourneyBtn = document.getElementById('start-journey-btn');
    if (startJourneyBtn) {
        startJourneyBtn.addEventListener('click', function() {
            navigateToStep('age-section');
        });
    }
    
    // Dynamic content generation
    setupDepartmentSection();
    setupApproachSection();
    setupAnesthesiaSection();
    setupASASection();
    
    // Final submit button
    const beginVisualizationBtn = document.getElementById('begin-visualization-btn');
    if (beginVisualizationBtn) {
        beginVisualizationBtn.addEventListener('click', function() {
            // Process collected data and start journey
            processFormData();
        });
    }
}

/**
 * Set up step navigation buttons
 */
function setupStepNavigation() {
    // Next buttons
    const nextButtons = document.querySelectorAll('.next-btn');
    nextButtons.forEach(button => {
        button.addEventListener('click', function() {
            const nextStep = this.getAttribute('data-next');
            if (nextStep && validateCurrentStep(this.closest('.step-section').id)) {
                navigateToStep(nextStep);
            }
        });
    });
    
    // Back buttons
    const backButtons = document.querySelectorAll('.back-btn');
    backButtons.forEach(button => {
        button.addEventListener('click', function() {
            const prevStep = this.getAttribute('data-prev');
            if (prevStep) {
                navigateToStep(prevStep);
            }
        });
    });
}

/**
 * Navigate to a specific step
 * @param {string} stepId - The ID of the step to navigate to
 */
function navigateToStep(stepId) {
    // Hide all steps
    const allSteps = document.querySelectorAll('.step-section');
    allSteps.forEach(step => {
        step.classList.remove('active');
    });
    
    // Show the target step
    const targetStep = document.getElementById(stepId);
    if (targetStep) {
        targetStep.classList.add('active');
        window.scrollTo(0, 0);
    }
    
    // Special case for gender step
    if (stepId === 'department-section') {
        updateDepartmentOptions();
    }
    
    // Update patient summary in final step
    if (stepId === 'summary-section') {
        updatePatientSummary();
    }
}

/**
 * Validate the current step before proceeding
 * @param {string} stepId - The ID of the current step
 * @returns {boolean} - Whether the step is valid
 */
function validateCurrentStep(stepId) {
    switch(stepId) {
        case 'age-section':
            const age = document.getElementById('age').value;
            if (!age || age < 18 || age > 100) {
                alert('Please enter a valid age between 18 and 100.');
                return false;
            }
            patientFormData.age = parseInt(age);
            return true;
            
        case 'gender-section':
            const sex = document.getElementById('sex').value;
            if (!sex) {
                alert('Please select your gender.');
                return false;
            }
            patientFormData.sex = sex;
            return true;
            
        case 'height-section':
            const feet = document.getElementById('feet').value;
            const inches = document.getElementById('inches').value;
            if (!feet || !inches) {
                alert('Please enter your height.');
                return false;
            }
            // Convert to cm
            const heightCm = convertHeightToCm(parseInt(feet), parseInt(inches));
            patientFormData.height = heightCm;
            document.getElementById('height').value = heightCm;
            return true;
            
        case 'weight-section':
            const weightLb = document.getElementById('weight-lb').value;
            if (!weightLb || weightLb < 70 || weightLb > 400) {
                alert('Please enter a valid weight between 70 and 400 lbs.');
                return false;
            }
            // Convert to kg
            const weightKg = convertWeightToKg(parseFloat(weightLb));
            patientFormData.weight = weightKg;
            document.getElementById('weight').value = weightKg;
            
            // Calculate BMI
            patientFormData.bmi = calculateBMI(patientFormData.height, patientFormData.weight);
            return true;
            
        case 'department-section':
            if (!patientFormData.department) {
                alert('Please select a surgical department.');
                return false;
            }
            return true;
            
        case 'approach-section':
            if (!patientFormData.approach) {
                alert('Please select a surgical approach.');
                return false;
            }
            return true;
            
        case 'anesthesia-section':
            if (!patientFormData.ane_type) {
                alert('Please select an anesthesia type.');
                return false;
            }
            return true;
            
        case 'asa-section':
            if (!patientFormData.asa) {
                alert('Please select an ASA physical status.');
                return false;
            }
            return true;
            
        default:
            return true;
    }
}

/**
 * Set up the department selection section
 */
function setupDepartmentSection() {
    const departmentCardsContainer = document.getElementById('department-cards');
    const departmentDescription = document.getElementById('department-description');
    const nextButton = document.querySelector('#department-section .next-btn');
    
    if (!departmentCardsContainer || !departmentDescription || !nextButton) return;
    
    // Clear existing content
    departmentCardsContainer.innerHTML = '';
    
    // Create department cards
    Object.keys(departmentDescriptions).forEach(dept => {
        const cardData = departmentDescriptions[dept];
        const card = document.createElement('div');
        card.className = 'department-card';
        card.setAttribute('data-department', dept);
        card.innerHTML = `
            <h3>${cardData.title}</h3>
            <p class="stat">${cardData.stats}</p>
        `;
        
        card.addEventListener('click', function() {
            // Remove selection from all cards
            document.querySelectorAll('.department-card').forEach(c => {
                c.classList.remove('selected');
            });
            
            // Add selection to clicked card
            this.classList.add('selected');
            
            // Update department description
            departmentDescription.innerHTML = `<p>${cardData.description}</p>`;
            
            // Store selected department
            patientFormData.department = dept;
            
            // Enable next button
            nextButton.disabled = false;
        });
        
        departmentCardsContainer.appendChild(card);
    });
}

/**
 * Update department options based on selected gender
 */
function updateDepartmentOptions() {
    const sex = patientFormData.sex;
    const departmentCards = document.querySelectorAll('.department-card');
    
    departmentCards.forEach(card => {
        const dept = card.getAttribute('data-department');
        
        // Hide Gynecology for male patients
        if (sex === 'M' && dept === 'Gynecology') {
            card.style.display = 'none';
        } else {
            card.style.display = 'block';
        }
    });
}

/**
 * Set up the approach selection section
 */
function setupApproachSection() {
    const approachCardsContainer = document.getElementById('approach-cards');
    const approachDescription = document.getElementById('approach-description');
    const nextButton = document.querySelector('#approach-section .next-btn');
    
    if (!approachCardsContainer || !approachDescription || !nextButton) return;
    
    // Clear existing content
    approachCardsContainer.innerHTML = '';
    
    // Create approach cards
    Object.keys(approachDescriptions).forEach(approach => {
        const cardData = approachDescriptions[approach];
        const card = document.createElement('div');
        card.className = 'approach-card';
        card.setAttribute('data-approach', approach);
        card.innerHTML = `
            <h3>${cardData.title}</h3>
            <p class="stat">${cardData.stats}</p>
        `;
        
        card.addEventListener('click', function() {
            // Remove selection from all cards
            document.querySelectorAll('.approach-card').forEach(c => {
                c.classList.remove('selected');
            });
            
            // Add selection to clicked card
            this.classList.add('selected');
            
            // Update approach description
            approachDescription.innerHTML = `<p>${cardData.description}</p>`;
            
            // Store selected approach
            patientFormData.approach = approach;
            
            // Enable next button
            nextButton.disabled = false;
        });
        
        approachCardsContainer.appendChild(card);
    });
}

/**
 * Update approach percentages once department is selected
 */
function updateApproachPercentages() {
    const department = patientFormData.department;
    if (!department || !departmentConstraints[department]) return;
    
    const approachStats = departmentConstraints[department].stats.approaches;
    
    document.querySelectorAll('.approach-percent').forEach(span => {
        const approach = span.getAttribute('data-approach');
        if (approachStats && approachStats[approach] !== undefined) {
            span.textContent = `${approachStats[approach]}%`;
        } else {
            span.textContent = 'N/A';
        }
    });
}

/**
 * Set up the anesthesia selection section
 */
function setupAnesthesiaSection() {
    const anesthesiaCardsContainer = document.getElementById('anesthesia-cards');
    const anesthesiaDescription = document.getElementById('anesthesia-description');
    const nextButton = document.querySelector('#anesthesia-section .next-btn');
    
    if (!anesthesiaCardsContainer || !anesthesiaDescription || !nextButton) return;
    
    // Clear existing content
    anesthesiaCardsContainer.innerHTML = '';
    
    // Create anesthesia cards
    Object.keys(anesthesiaDescriptions).forEach(anesthesia => {
        const cardData = anesthesiaDescriptions[anesthesia];
        const card = document.createElement('div');
        card.className = 'anesthesia-card';
        card.setAttribute('data-anesthesia', anesthesia);
        card.innerHTML = `
            <h3>${cardData.title}</h3>
            <p class="stat">${cardData.stats}</p>
        `;
        
        card.addEventListener('click', function() {
            // Remove selection from all cards
            document.querySelectorAll('.anesthesia-card').forEach(c => {
                c.classList.remove('selected');
            });
            
            // Add selection to clicked card
            this.classList.add('selected');
            
            // Update anesthesia description
            anesthesiaDescription.innerHTML = `<p>${cardData.description}</p>`;
            
            // Store selected anesthesia
            patientFormData.ane_type = anesthesia;
            
            // Enable next button
            nextButton.disabled = false;
        });
        
        anesthesiaCardsContainer.appendChild(card);
    });
}

/**
 * Update anesthesia percentages once department is selected
 */
function updateAnesthesiaPercentages() {
    const department = patientFormData.department;
    if (!department || !departmentConstraints[department]) return;
    
    const anesthesiaStats = departmentConstraints[department].stats.anesthesia;
    
    document.querySelectorAll('.anesthesia-percent').forEach(span => {
        const anesthesia = span.getAttribute('data-anesthesia');
        if (anesthesiaStats && anesthesiaStats[anesthesia] !== undefined) {
            span.textContent = `${anesthesiaStats[anesthesia]}%`;
        } else {
            span.textContent = 'N/A';
        }
    });
}

/**
 * Set up the ASA selection section
 */
function setupASASection() {
    const asaCards = document.querySelectorAll('.asa-card');
    const nextButton = document.querySelector('#asa-section .next-btn');
    
    if (!asaCards.length || !nextButton) return;
    
    asaCards.forEach(card => {
        card.addEventListener('click', function() {
            // Remove selection from all cards
            asaCards.forEach(c => {
                c.classList.remove('selected');
            });
            
            // Add selection to clicked card
            this.classList.add('selected');
            
            // Store selected ASA
            const asa = this.getAttribute('data-asa');
            patientFormData.asa = parseInt(asa);
            document.getElementById('asa').value = asa;
            
            // Enable next button
            nextButton.disabled = false;
        });
    });
}

/**
 * Update patient summary in final step
 */
function updatePatientSummary() {
    const summaryContainer = document.getElementById('patient-profile-summary');
    if (!summaryContainer) return;
    
    // Calculate BMI description
    let bmiDescription = '';
    if (patientFormData.bmi < 18.5) bmiDescription = 'Underweight';
    else if (patientFormData.bmi < 25) bmiDescription = 'Normal weight';
    else if (patientFormData.bmi < 30) bmiDescription = 'Overweight';
    else if (patientFormData.bmi < 35) bmiDescription = 'Obesity (Class I)';
    else if (patientFormData.bmi < 40) bmiDescription = 'Obesity (Class II)';
    else bmiDescription = 'Severe Obesity (Class III)';
    
    // Format height in imperial
    const heightInInches = patientFormData.height / 2.54;
    const feet = Math.floor(heightInInches / 12);
    const inches = Math.round(heightInInches % 12);
    
    // Format weight in imperial
    const weightInLbs = Math.round(patientFormData.weight * 2.20462);
    
    // Build summary HTML
    let summaryHTML = `
        <div class="summary-item">
            <span class="summary-label">Age:</span>
            <span class="summary-value">${patientFormData.age} years</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Sex:</span>
            <span class="summary-value">${patientFormData.sex === 'M' ? 'Male' : 'Female'}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Height:</span>
            <span class="summary-value">${feet}'${inches}" (${patientFormData.height} cm)</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Weight:</span>
            <span class="summary-value">${weightInLbs} lbs (${patientFormData.weight.toFixed(1)} kg)</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">BMI:</span>
            <span class="summary-value">${patientFormData.bmi.toFixed(1)} - ${bmiDescription}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Department:</span>
            <span class="summary-value">${departmentDescriptions[patientFormData.department].title}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Surgical Approach:</span>
            <span class="summary-value">${approachDescriptions[patientFormData.approach].title}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Anesthesia Type:</span>
            <span class="summary-value">${anesthesiaDescriptions[patientFormData.ane_type].title}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">ASA Status:</span>
            <span class="summary-value">ASA ${patientFormData.asa}</span>
        </div>
    `;
    
    summaryContainer.innerHTML = summaryHTML;
}

/**
 * Process the collected form data and start the journey
 * Fixed to ensure proper loading of pre-op stage
 */
function processFormData() {
    console.log("Processing form data", patientFormData);
    
    // Transfer data to the global patientData object
    patientData = {
        age: patientFormData.age,
        sex: patientFormData.sex,
        height: patientFormData.height,
        weight: patientFormData.weight,
        bmi: patientFormData.bmi,
        asa: patientFormData.asa,
        department: patientFormData.department,
        approach: patientFormData.approach,
        ane_type: patientFormData.ane_type,
        emop: false // Assuming non-emergency for simplicity
    };
    
    console.log("Patient data prepared:", patientData);
    console.log()
    // Find similar patients
    similarPatients = findSimilarPatients(patientData);
    console.log(similarPatients);
    console.log(`Found ${similarPatients.length} similar patients`);
    
    // Generate the surgical journey
    generateSurgicalJourney();
    
    // Hide the multi-step form and show the journey
    hideAllStepSections();
    
    // Show the journey container
    const journeyContainer = document.getElementById('journey-container');
    if (journeyContainer) {
        journeyContainer.style.display = 'block';
    }
    
    // Set the current stage to pre-op and explicitly update UI
    currentStage = 'pre';
    updateStageUI('pre');
    
    // Display patient summary
    displayPatientSummary();
}

/**
 * Hide all step sections
 */
function hideAllStepSections() {
    const allSteps = document.querySelectorAll('.step-section');
    allSteps.forEach(step => {
        step.classList.remove('active');
        step.style.display = 'none';
    });
}

// Update the initialize function to include our multi-step form initialization
function initialize() {
    console.log("Initializing application");
    
    // Load the dataset
    loadDataset();
    
    // Initialize multi-step form
    initializeMultiStepForm();
    
    // ... rest of the original initialize function
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const timelineSteps = document.querySelectorAll('.timeline-step');
    const restartBtn = document.getElementById('restart-btn');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', navigateToPreviousStage);
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', navigateToNextStage);
    }
    
    // Set up timeline step navigation
    if (timelineSteps.length > 0) {
        timelineSteps.forEach(step => {
            step.addEventListener('click', function() {
                const stage = this.getAttribute('data-stage');
                if (this.classList.contains('completed') || 
                    (stage === 'during' && document.querySelector('[data-stage="pre"]').classList.contains('completed')) ||
                    (stage === 'post' && document.querySelector('[data-stage="during"]').classList.contains('completed'))) {
                    navigateToStage(stage);
                }
            });
        });
    }
    
    // Set up restart button
    if (restartBtn) {
        restartBtn.addEventListener('click', restartJourney);
    }
    
    console.log('Surgical Journey Visualization initialized');
}