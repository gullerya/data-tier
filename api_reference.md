API Reference
=============

For **obtaining** your copy of the 'data-tier.js' you may use:
*	<code>bower install data-tier</code>
*	<code>npm install data-tier</code>
*	putting 'data-tier' dependency in the config file of either bower or npm package manager, whichever you use

The **consumption** of the DataTier library begins from it's loading and initiation. This may be done in two flavors:
*	**basic** one performs loading and initiation in the most standard and simple way, yet the library will be loaded into the predefined namespace <code>**window.Modules.DataTier**</code>
*	**advanced** flavor requires custom loading and execution (see an example below), yet allows to specify the namespace you'd like the DataTier to be 'installed'

###### Example A: getting DataTier in a *basic* way

Put a script tag inside you HTML file referring to the location of data-tier.js (replace the below path with your local copy's one):

<code>&lt;script src="../libs/data-tier.js"&gt;&lt;/script&gt;</code>

Use the APIs in any place in application (main window):<br>
<code>var userTie = window.Modules.DataTier.Ties.create('user', {});</code>

Use the APIs in any place in application (iFrame window):<br>
<code>var userTie = parentWindow.Modules.DataTier.Ties.create('user', {});</code>

###### Example B: getting DataTier in an *advanced* way

