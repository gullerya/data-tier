# API Reference

For **obtaining** your copy of the 'data-tier.js' you may use:
*	<code>bower install data-tier</code>
*	<code>npm install data-tier</code>
*	putting 'data-tier' dependency in the config file of either bower or npm package manager, whichever you use

The **consumption** of the DataTier library begins from it's loading and initiation. This may be done in two flavors:
*	**basic** one performs loading and initiation in the most standard and simple way, yet the library will be loaded into the predefined namespace <code>**window.Modules.DataTier**</code>
*	**advanced** flavor requires custom loading and execution (see an example below), yet allows to specify the namespace you'd like the DataTier to be 'installed'

#### Example A: getting DataTier in a *basic* way

Put a script tag inside you HTML file referring to the location of data-tier.js (replace the below path with your local copy's one):

<code>&lt;script src="../libs/data-tier.js"&gt;&lt;/script&gt;</code>

Use the APIs in any place in application (main window):<br>
<code>var userTie = window.Modules.DataTier.Ties.create('user', {});</code>

Use the APIs in any place in application (iframe window):<br>
<code>var userTie = parentWindow.Modules.DataTier.Ties.create('user', {});</code>

#### Example B: getting DataTier in an *advanced* way

Let's review the following snippet:
<pre><code>var xhr = new XMLHttpRequest(),
	customNS = {};
xhr.open('get', '../libs/data-tier.js');
xhr.onload = function () {
	new Function(xhr.responseText)({ namespace: customNS });
	//	DataTier is initialized in the specified namespace object
	var userTie = customNS.DataTier.Ties.create('user', {});
}
xhr.send();</code></pre>

Actually, this one is quite straght forward as well. We're just loading the code of the library as a text file and then executing it via <code>new Function(<string>)</code> syntax providing it with an options object.

Options object currently have only one supported property <code>namespace</code> which MUST be an object, that will hold the reference to the library. If no options object supplied, or it doesn't have a <code>namespace</code> property or the <code>namespace</code> property is not an object or <code>null</code> - DataTier will be initialized in the default namespace.

* Please pay attention, that <code>new Function()</code> syntax is effectively the same as <code>eval()</code> syntax. Since some hold strong opinions against using these (not myself, though), I'm explicitly noting this here.
