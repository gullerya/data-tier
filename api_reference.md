API Reference
=============

To obtain your <b>copy</b> of the 'data-tier.js' you may use:
<ul>
	<li>bower install data-tier</li>
	<li>npm install data-tier</li>
	<li>putting 'data-tier' dependency in the config file of either bower or npm package manager, whichever you use</li>
</ul>

The consumption of the DataTier library begins from loading and initiating. This may be done in two flavors:
<ul>
	<li><b>basic</b> one performs loading and initiation in the most standard and simple way, yet the library will be loaded into the predefined namespace <b>window.Modules.DataTier</b></li>
	<li><b>advanced</b> flavor requires custom loading and execution (see an example below), yet allows to specify the namespace you'd like the DataTier to be 'installed'</li>
</ul>

Example: getting DataTier in a basic way
----------------------------------------

Put a script tag inside you HTML file referring to the location of data-tier.js (your local copy)