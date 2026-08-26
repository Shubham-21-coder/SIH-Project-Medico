import crypto from 'crypto';

/**
 * FHIR R4 Bundle Generator for Ayushman Bharat Digital Mission (ABDM) Integration
 * Generates valid HL7 FHIR R4 JSON documents for Clinical Consultation & OPD Records.
 */
export function generateAbdmFhirBundle(
  patientInfo: any,
  chiefComplaint: string,
  summaryData: any,
  prescriptionsData?: any
) {
  const bundleId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const patientId = patientInfo?.identifier || `ABHA-${crypto.randomUUID().substring(0, 8)}`;
  const patientName = patientInfo?.name || 'Patient';
  const age = patientInfo?.age || 30;
  const gender = (patientInfo?.gender || 'male').toLowerCase();

  const patientResource = {
    resourceType: 'Patient',
    id: patientId,
    identifier: [
      {
        system: 'https://healthid.ndhm.gov.in',
        value: patientInfo?.abhaNumber || patientId,
      },
    ],
    name: [
      {
        use: 'official',
        text: patientName,
      },
    ],
    gender: gender === 'female' ? 'female' : 'male',
    birthDate: `${new Date().getFullYear() - Number(age)}-01-01`,
  };

  const encounterResource = {
    resourceType: 'Encounter',
    id: `enc-${bundleId.substring(0, 8)}`,
    status: 'finished',
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: 'AMB',
      display: 'ambulatory / outpatient',
    },
    subject: {
      reference: `Patient/${patientId}`,
      display: patientName,
    },
    period: {
      start: timestamp,
      end: timestamp,
    },
  };

  const conditionResource = {
    resourceType: 'Condition',
    id: `cond-${bundleId.substring(0, 8)}`,
    clinicalStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
          code: 'active',
          display: 'Active',
        },
      ],
    },
    verificationStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
          code: 'provisional',
          display: 'Provisional Diagnosis',
        },
      ],
    },
    code: {
      text: chiefComplaint || 'Clinical OPD Consultation',
    },
    subject: {
      reference: `Patient/${patientId}`,
      display: patientName,
    },
  };

  const observationResource = {
    resourceType: 'Observation',
    id: `obs-${bundleId.substring(0, 8)}`,
    status: 'final',
    code: {
      text: 'Clinical Intake History & Review of Systems',
    },
    subject: {
      reference: `Patient/${patientId}`,
      display: patientName,
    },
    valueString: `HPI: ${summaryData?.hpi || 'None'}. ROS: ${summaryData?.review_of_systems || 'None'}. Past History: ${summaryData?.past_history || 'None'}.`,
  };

  const compositionResource = {
    resourceType: 'Composition',
    id: `comp-${bundleId.substring(0, 8)}`,
    status: 'final',
    type: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '371530004',
          display: 'Clinical consultation note',
        },
      ],
      text: 'OPD Clinical Consultation Note (ABDM / MediKiosk)',
    },
    subject: {
      reference: `Patient/${patientId}`,
      display: patientName,
    },
    date: timestamp,
    title: 'MediKiosk AI-Assisted Clinical History Note',
    section: [
      {
        title: 'Chief Complaint & HPI',
        text: {
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml"><p>${summaryData?.hpi || chiefComplaint}</p></div>`,
        },
      },
      {
        title: 'Past Medical & Medication History',
        text: {
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml"><p>${summaryData?.past_history || 'None'}</p></div>`,
        },
      },
      {
        title: 'Review of Systems',
        text: {
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml"><p>${summaryData?.review_of_systems || 'None'}</p></div>`,
        },
      },
    ],
  };

  return {
    resourceType: 'Bundle',
    id: bundleId,
    meta: {
      lastUpdated: timestamp,
      profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle'],
    },
    identifier: {
      system: 'https://healthid.ndhm.gov.in/bundles',
      value: bundleId,
    },
    type: 'document',
    timestamp,
    entry: [
      { fullUrl: `Composition/${compositionResource.id}`, resource: compositionResource },
      { fullUrl: `Patient/${patientResource.id}`, resource: patientResource },
      { fullUrl: `Encounter/${encounterResource.id}`, resource: encounterResource },
      { fullUrl: `Condition/${conditionResource.id}`, resource: conditionResource },
      { fullUrl: `Observation/${observationResource.id}`, resource: observationResource },
    ],
  };
}
