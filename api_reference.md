API Reference
=============

For **obtaining** your copy of the 'data-tier.js' you may use:
<ul>
	<li><code>bower install data-tier</code></li>
	<li><code>npm install data-tier</code></li>
	<li>putting 'data-tier' dependency in the config file of either bower or npm package manager, whichever you use</li>
</ul>

The **consumption** of the DataTier library begins from it's loading and initiation. This may be done in two flavors:
<ul>
	<li>**basic** one performs loading and initiation in the most standard and simple way, yet the library will be loaded into the predefined namespace <code>**window.Modules.DataTier**</code></li>
	<li>**advanced** flavor requires custom loading and execution (see an example below), yet allows to specify the namespace you'd like the DataTier to be 'installed'</li>
</ul>

###### Example A: getting DataTier in a **basic** way

Put a script tag inside you HTML file referring to the location of data-tier.js (replace the below path with your local copy's one):<br>
<code>&lt;script src="../libs/data-tier.js"&gt;&lt;/script&gt;</code><br>

Use the APIs in any place in application (main window):<br>
<code>var userTie = window.Modules.DataTier.Ties.create('user', {});</code><br>

Use the APIs in any place in application (iFrame window):<br>
<code>var userTie = parentWindow.Modules.DataTier.Ties.create('user', {});</code><br>

###### Example B: getting DataTier in an **advanced** way

