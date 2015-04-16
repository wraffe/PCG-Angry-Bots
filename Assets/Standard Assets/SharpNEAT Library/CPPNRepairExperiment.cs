using System;
using System.Collections.Generic;
using System.Text;
using System.Xml;
using SharpNeat.Core;
using SharpNeat.Decoders;
using SharpNeat.Decoders.Neat;
using SharpNeat.DistanceMetrics;
using SharpNeat.EvolutionAlgorithms;
using SharpNeat.EvolutionAlgorithms.ComplexityRegulation;
using SharpNeat.Genomes.HyperNeat;
using SharpNeat.Genomes.Neat;
using SharpNeat.Network;
using SharpNeat.Phenomes;
using SharpNeat.SpeciationStrategies;
using SharpNeat.Domains;

using UnityEngine;


    /* A lot of the INeatExperiment classes are just setting parameter values.
     * My class is a blend of other examples because we want CPPN but not for hyperNEAT (which no example exists for)
     */
    class CPPNRepairExperiment : INeatExperiment
    {

        NeatEvolutionAlgorithmParameters _eaParams;
        NeatGenomeParameters _neatGenomeParams;
        string _name;
        string _description;
        int _populationSize;
        int _specieCount;
        NetworkActivationScheme _activationScheme;
        string _complexityRegulationStr;
        int? _complexityThreshold;
        //ParallelOptions _parallelOptions;
	  	PCGSharpHighLevelFeatures _originalFeatures;
	
		public PCGWekaClassifier playerModel;
		public List<PCGNeatNodeData> geomNodeList;
		

        #region Constructors

        /// <summary>
        /// Default constructor.
        /// </summary>
        public CPPNRepairExperiment()
        {
        }	
	
		public void SetOriginalFeatures(PCGSharpHighLevelFeatures original) 
		{
			_originalFeatures = original;
		}
        
        #endregion

        #region INeatExperiment

        /// <summary>
        /// Gets the name of the experiment.
        /// </summary>
        public string Name
        {
            get { return _name; }
        }

        /// <summary>
        /// Gets human readable explanatory text for the experiment.
        /// </summary>
        public string Description
        {
            get { return _description; }
        }

        /// <summary>
        /// Gets the number of inputs required by the network/black-box that the underlying problem domain is based on.
        /// 6 inputs. 2 * (x,y,z) CPPN substrate node position coordinates, plus one optional connection length input.
        /// </summary>
        public int InputCount
        {
            get { return 2; }
        }

        /// <summary>
        /// Gets the number of outputs required by the network/black-box that the underlying problem domain is based on.
        /// 2 outputs.CPPN weight output and bias weight output.
        /// </summary>
        public int OutputCount
        {
            get { return 6; }
        }

        /// <summary>
        /// Gets the default population size to use for the experiment.
        /// </summary>
        public int DefaultPopulationSize
        {
            get { return _populationSize; }
        }

        /// <summary>
        /// Gets the NeatEvolutionAlgorithmParameters to be used for the experiment. Parameters on this object can be 
        /// modified. Calls to CreateEvolutionAlgorithm() make a copy of and use this object in whatever state it is in 
        /// at the time of the call.
        /// </summary>
        public NeatEvolutionAlgorithmParameters NeatEvolutionAlgorithmParameters
        {
            get { return _eaParams; }
        }

        /// <summary>
        /// Gets the NeatGenomeParameters to be used for the experiment. Parameters on this object can be modified. Calls
        /// to CreateEvolutionAlgorithm() make a copy of and use this object in whatever state it is in at the time of the call.
        /// </summary>
        public NeatGenomeParameters NeatGenomeParameters
        {
            get { return _neatGenomeParams; }
        }

        /// <summary>
        /// Initialize the experiment with some optional XML configutation data.
        /// </summary>
        public void Initialize(string name, XmlElement xmlConfig)
        {
            _name = name;
            _description = "Just a test experiment class";

            // Dont use xml, just hard code the values for now
            _populationSize = 50;
            _specieCount = 5;

            // PicBreeder appears to use acyclic networks, so we will do the same. 
            // Cyclic ("recurrent") networks seem better for realtime reactive controllers, e.g. predator-prey, where the recurrent connections allow for memory of past events
            _activationScheme = NetworkActivationScheme.CreateAcyclicScheme();
            
            // Next two values just seem to be commen. 
            // Relative just means that limit of complexification is relative to the last simplification process (so it can continue to grow)
            // Alternative is "Absolute", which means, with a threshold of 10, network wont ever be more complex than 10 connections
            _complexityRegulationStr = "Absolute";
            _complexityThreshold = 50;

            //_parallelOptions = new ParallelOptions();
            

            // Param constructors set defaul param values, a lot of experiments just leave them as default
            _eaParams = new NeatEvolutionAlgorithmParameters();
            _eaParams.SpecieCount = _specieCount;
            _neatGenomeParams = new NeatGenomeParameters();
            _neatGenomeParams.FeedforwardOnly = _activationScheme.AcyclicNetwork;
        }

        /// <summary>
        /// Load a population of genomes from an XmlReader and returns the genomes in a new list.
        /// The genome factory for the genomes can be obtained from any one of the genomes.
        /// </summary>
        public List<NeatGenome> LoadPopulation(XmlReader xr)
        {
            CppnGenomeFactory genomeFactory = (CppnGenomeFactory)CreateGenomeFactory();
            return NeatGenomeXmlIO.ReadCompleteGenomeList(xr, false, genomeFactory);
        }

        /// <summary>
        /// Save a population of genomes to an XmlWriter.
        /// </summary>
        public void SavePopulation(XmlWriter xw, IList<NeatGenome> genomeList)
        {
			// Writing node IDs is not necessary for NEAT.
            NeatGenomeXmlIO.WriteComplete(xw, genomeList, true);
        }


        /// <summary>
        /// Create a genome decoder for the experiment.
        /// </summary>
        public IGenomeDecoder<NeatGenome, IBlackBox> CreateGenomeDecoder()
        {
            // HyperNEAT Algorithms have their own decoders to take into account the substrait
            return new NeatGenomeDecoder(_activationScheme);
        }

        /// <summary>
        /// Create a genome factory for the experiment.
        /// Create a genome factory with our neat genome parameters object and the appropriate number of input and output neuron genes.
        /// </summary>
        public IGenomeFactory<NeatGenome> CreateGenomeFactory()
        {
            return new CppnGenomeFactory(InputCount, OutputCount, GetCppnActivationFunctionLibrary(), _neatGenomeParams);
        }


        /***** All "CreateEvolutionAlgorithm" methods seem to be same in all experiments except for the "evalutator" line *****/

        /// <summary>
        /// Create and return a NeatEvolutionAlgorithm object ready for running the NEAT algorithm/search. Various sub-parts
        /// of the algorithm are also constructed and connected up.
        /// Uses the experiments default population size defined in the experiment's config XML.
        /// </summary>
        public NeatEvolutionAlgorithm<NeatGenome> CreateEvolutionAlgorithm()
        {
            return CreateEvolutionAlgorithm(_populationSize);
        }

        /// <summary>
        /// Create and return a NeatEvolutionAlgorithm object ready for running the NEAT algorithm/search. Various sub-parts
        /// of the algorithm are also constructed and connected up.
        /// This overload accepts a population size parameter that specifies how many genomes to create in an initial randomly
        /// generated population.
        /// </summary>
        public NeatEvolutionAlgorithm<NeatGenome> CreateEvolutionAlgorithm(int populationSize)
        {
            // Create a genome factory with our neat genome parameters object and the appropriate number of input and output neuron genes.
            IGenomeFactory<NeatGenome> genomeFactory = CreateGenomeFactory();

            // Create an initial population of randomly generated genomes.
            List<NeatGenome> genomeList = genomeFactory.CreateGenomeList(populationSize, 0);

            // Create evolution algorithm.
            return CreateEvolutionAlgorithm(genomeFactory, genomeList);
        }

        /// <summary>
        /// Create and return a NeatEvolutionAlgorithm object ready for running the NEAT algorithm/search. Various sub-parts
        /// of the algorithm are also constructed and connected up.
        /// This overload accepts a pre-built genome population and their associated/parent genome factory.
        /// </summary>
        public NeatEvolutionAlgorithm<NeatGenome> CreateEvolutionAlgorithm(IGenomeFactory<NeatGenome> genomeFactory, List<NeatGenome> genomeList)
        {
			Debug.Log("........CreateEvolutionAlgorithm: Setting parameters");
            // Create distance metric. Mismatched genes have a fixed distance of 10; for matched genes the distance is their weigth difference.
            IDistanceMetric distanceMetric = new ManhattanDistanceMetric(1.0, 0.0, 10.0);
            ISpeciationStrategy<NeatGenome> speciationStrategy = new KMeansClusteringStrategy<NeatGenome>(distanceMetric);

            // Create complexity regulation strategy.
            IComplexityRegulationStrategy complexityRegulationStrategy = ExperimentUtils.CreateComplexityRegulationStrategy(_complexityRegulationStr, _complexityThreshold);
			
			Debug.Log("........CreateEvolutionAlgorithm: Creating ea");
            // Create the evolution algorithm.
            NeatEvolutionAlgorithm<NeatGenome> ea = new NeatEvolutionAlgorithm<NeatGenome>(_eaParams, speciationStrategy, complexityRegulationStrategy);
		
			Debug.Log("........CreateEvolutionAlgorithm: Creating evaluator");
            // Create IBlackBox evaluator.
            CPPNRepairEvaluator2 evaluator = new CPPNRepairEvaluator2(this);
		    evaluator.SetOriginalFeatures(_originalFeatures);
		
			Debug.Log("........CreateEvolutionAlgorithm: Creating genome decoder and serial evaluator");
            // Create genome decoder.
            IGenomeDecoder<NeatGenome, IBlackBox> genomeDecoder = CreateGenomeDecoder();

            // Create a genome list evaluator. This packages up the genome decoder with the genome evaluator.
            IGenomeListEvaluator<NeatGenome> innerEvaluator = new SerialGenomeListEvaluator<NeatGenome, IBlackBox>(genomeDecoder, evaluator);

            // Wrap the list evaluator in a 'selective' evaulator that will only evaluate new genomes. That is, we skip re-evaluating any genomes
            // that were in the population in previous generations (elite genomes). This is determiend by examining each genome's evaluation info object.
            /*IGenomeListEvaluator<NeatGenome> selectiveEvaluator = new SelectiveGenomeListEvaluator<NeatGenome>(
                                                                                    innerEvaluator,
                                                                                    SelectiveGenomeListEvaluator<NeatGenome>.CreatePredicate_OnceOnly());
            */                                                                        
            // Initialize the evolution algorithm.
			Debug.Log("........CreateEvolutionAlgorithm: Initializing ea");
            ea.Initialize(innerEvaluator, genomeFactory, genomeList);
		
			Debug.Log("........CreateEvolutionAlgorithm: Returning");
            // Finished. Return the evolution algorithm
            return ea;
        }

        #endregion




        IActivationFunctionLibrary GetCppnActivationFunctionLibrary()
        {
            return DefaultActivationFunctionLibrary.CreateLibraryCppn();
        }
    }