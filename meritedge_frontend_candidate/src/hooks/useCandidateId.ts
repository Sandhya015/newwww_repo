import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { cleanCandidateId } from '../utils/candidateIdUtils';

export const useCandidateId = () => {
    const { candidate_id } = useParams();
    const storedCandidateId = useSelector((state: any) => state.misc.candidate_id);
    
    // Clean the candidate_id by removing any extra quotes
    const cleanStoredId = cleanCandidateId(storedCandidateId);
    const cleanUrlId = cleanCandidateId(candidate_id);
    
    // Return stored candidate_id if available, otherwise fall back to URL parameter
    return cleanStoredId || cleanUrlId;
};
