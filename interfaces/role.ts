export enum Role {
  /**
   * Pacjent
   * ResourceType.Patient
   */
    patient = 'patient',
  /**
   * Pielęgniarka
   * ResourceType.Practitioner
   */
    nurse = 'nurse',
  /**
   * Terapeuta
   * ResourceType.Practitioner
   */
    therapist = 'therapist',
  /**
   * Lekarz
   * ResourceType.Practitioner
   */
    physician = 'physician',
  /**
   * Opiekun
   * ResourceType.RelatedPerson
   */
    relatedPerson = 'relatedPerson',
  /**
   * Administrator
   * BRAK RESOURCE
   */
    admin = 'admin',
  /**
   * Other
   * BRAK RESOURCE
   */
    other = 'other'
}
