#pragma strict

class PCGTreeNEATCandidate extends PCGTreeCandidate {
	function PCGTreeNEATCandidate(rootnode : PCGTreeNEATNode, branchProbability : float, branchDecay : float) {
		super(rootnode, 0, branchProbability, branchDecay);
	}
	
	// Copy constructor
	function PCGTreeNEATCandidate(oldCandidate : PCGTreeNEATCandidate) {
		var copyRoot : PCGTreeNEATNode = new PCGTreeNEATNode((oldCandidate.rootNode as PCGTreeNEATNode));
		copyRoot.RecursiveTreeCopy(oldCandidate.rootNode as PCGTreeNEATNode);
		
		// Skew the branching probabilities a little bit
		var branchProb : float = oldCandidate.branchingProbability + Random.Range(-0.5,0.5);
		if (branchProb < 0.05)
			branchProb = 0.05;
		else if (branchProb > 0.95)
			branchProb = 0.95;
		var branchDecay : float = oldCandidate.branchingDecay + Random.Range(-0.2,0.2);
		if (branchDecay < 0.1)
			branchDecay = 0.1;
		else if (branchDecay > 0.9)
			branchDecay = 0.9;
			
		super(copyRoot, 0, branchProb, branchDecay);
		this.directPathLength = oldCandidate.directPathLength;		
	}
}