/**
 * Cleans a candidate ID by removing any extra quotes or whitespace
 * @param candidateId - The candidate ID to clean
 * @returns Clean candidate ID string
 */
export const cleanCandidateId = (candidateId: string | null | undefined): string | null => {
    if (!candidateId) return null;
    
    // Convert to string and remove leading/trailing quotes and whitespace
    return String(candidateId)
        .replace(/^["']|["']$/g, '') // Remove surrounding quotes
        .trim(); // Remove whitespace
};

/**
 * Validates if a candidate ID is in the correct format (UUID)
 * @param candidateId - The candidate ID to validate
 * @returns boolean indicating if the ID is valid
 */
export const isValidCandidateId = (candidateId: string | null | undefined): boolean => {
    if (!candidateId) return false;
    
    const cleanId = cleanCandidateId(candidateId);
    if (!cleanId) return false;
    
    // UUID v4 pattern
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(cleanId);
};
