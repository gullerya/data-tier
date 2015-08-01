API Reference
=============

For <b>obtaining</b> your copy of the 'data-tier.js' you may use:
<ul>
	<li><code>bower install data-tier</code></li>
	<li><code>npm install data-tier</code></li>
	<li>putting 'data-tier' dependency in the config file of either bower or npm package manager, whichever you use</li>
</ul>

The <b>consumption</b> of the DataTier library begins from it's loading and initiation. This may be done in two flavors:
<ul>
	<li><b>basic</b> one performs loading and initiation in the most standard and simple way, yet the library will be loaded into the predefined namespace <code><b>window.Modules.DataTier</b></code></li>
	<li><b>advanced</b> flavor requires custom loading and execution (see an example below), yet allows to specify the namespace you'd like the DataTier to be 'installed'</li>
</ul>

Example: getting DataTier in a basic way
----------------------------------------

Put a script tag inside you HTML file referring to the location of data-tier.js (your local copy)