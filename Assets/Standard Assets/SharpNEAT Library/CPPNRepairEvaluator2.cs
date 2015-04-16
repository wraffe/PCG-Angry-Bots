using System;
using UnityEngine;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using SharpNeat.Core;
using SharpNeat.Phenomes;
using SharpNeat.Phenomes.NeuralNets;

// Only important interface method here is "Evaluate"
class CPPNRepairEvaluator2 : IPhenomeEvaluator<IBlackBox>
{
     #region Instance Fields
	CPPNRepairExperiment _experiment;
	PCGSharpHighLevelFeatures _originalFeatures;
	
    ulong _evalCount;
    bool _stopConditionSatisfied;

    ulong _evalBlockSize;
    ulong _nextEvalStop;
	PCGSharpHighLevelFeatures featureCounts;

    public CPPNRepairEvaluator2(CPPNRepairExperiment parentExperiment)
    {
		_experiment = parentExperiment;
        _evalBlockSize = 10000;
        _nextEvalStop = _evalBlockSize;
		featureCounts = new PCGSharpHighLevelFeatures();
    }
	
	public void SetOriginalFeatures(PCGSharpHighLevelFeatures original) 
	{
		_originalFeatures = original;
	}

    #endregion

    #region IPhenomeEvaluator<IBlackBox> Members

    /// <summary>
    /// Gets the total number of evaluations that have been performed.
    /// </summary>
    public ulong EvaluationCount
    {
        get { return _evalCount; }
    }

    /// <summary>
    /// Gets a value indicating whether some goal fitness has been achieved and that
    /// the the evolutionary algorithm/search should stop. This property's value can remain false
    /// to allow the algorithm to run indefinitely.
    /// </summary>
    public bool StopConditionSatisfied
    {
        get { return _stopConditionSatisfied; }
    }

    /// <summary>
    /// Evaluate the provided phenome and return its fitness score. 
    /// This takes a blackbox (pretty much the decoded neuralnetwork (the phenome)) that input can be passed to 
    /// and output processed in the domain. Makes it very easy, we dont have to wory about the genome (genelist) or phenome (network) at all
    /// </summary>
    public FitnessInfo Evaluate(IBlackBox box)
    {   
		// Set a maximum number of evaluations
		_evalCount++;
        int difference = 0;		
		FitnessInfo fitnessInfo = new FitnessInfo(0.0, 0.0); 

        if (_evalCount > _nextEvalStop)
        {
            _nextEvalStop += _evalBlockSize;
            Debug.Log("Eval Count = " + _evalCount);
			if (_evalCount >= 500000)
				_stopConditionSatisfied = true;
        }
		
		// Only use player model if it has been initialized. Otherwise, all fitness is 0.5
		if (_experiment.geomNodeList!=null) {
			// Get highlevel features
		    if (_experiment==null)
				Debug.Log("Experiment null");
			if (_experiment.geomNodeList==null)
				Debug.Log("Geom node list null");
			for (int i = 0; i < _experiment.geomNodeList.Count; i++) {
				// Get cppn output for each node
				box.InputSignalArray[0] = _experiment.geomNodeList[i].normDepth;
				box.InputSignalArray[1] = _experiment.geomNodeList[i].normSiblingIndex;
				
				box.ResetState();
				box.Activate();			
				
				double[] outputs = new double[box.OutputCount];
				for (int j = 0; j < box.OutputCount; j++) {
					outputs[j] = box.OutputSignalArray[j];
				}
				
				// Convert each nodes cppn output into a contentId
				int combinedContentID = featureCounts.CPPNOutputToSettingsId(outputs);
				difference = difference + Math.Abs(_experiment.geomNodeList[i].contentSetting-combinedContentID);
			}
			
			// Compare to the features of existing map			
			if (difference == 0)
				_stopConditionSatisfied = true;
			
			difference = 100000-difference;
			
			// Fitness is the membership to the "Like" class (positive class)
			fitnessInfo = new FitnessInfo((double)difference, (double)difference);
		}
		else
			_stopConditionSatisfied = true;

        return fitnessInfo; 
    }

    /// <summary>
    /// Reset the internal state of the evaluation scheme if any exists.
    /// </summary>
    public void Reset()
    {
		_stopConditionSatisfied = false;
    }

    #endregion
}
