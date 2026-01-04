export interface FieldSelection {
    /** Fields requested by client */
    requested?: string[];
    /** Default fields if none requested */
    defaults: string[];
    /** Fields that cannot be selected (security) */
    excluded: string[];
    /** All allowed fields that can be selected */
    selectable: string[];
}
