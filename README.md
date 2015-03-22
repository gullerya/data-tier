DataTier - Intro
================

DataTier is a framework, or better utility, that provides two way binding (Model-View - View-Model, aka MVVM) in the domain of client HTML/Javascript applications.
The most important principals that guided the author were simplicity of usage, shortest learning curve and yet an ability to give all of the essentials expected from such a utility.
I tried to design this library in such a way that the more simpe the usecase - less needs to be done to get it working.
So i believe that in it's current architecture, DataTier covers most of the usecases in quite a simple and straight forward way, yet the more complicated the things you'd need to achieve with it - you can, you'll just need to get more into the internals.


Basic examples
==============

Let's assume you have and object that holds user info and you want to bind it to it's view in HTML. This splits into the <b>declaration in the HTML</b> and <b>functional part in the Javascript</b>.<br>
In Javascript you'll need to tell to DataTier that the object 'user' is to be tied to it's views and watched for changes. This is done using API as in the following example (let's assume that you've got the reference to the library in 'dataTier' variable, we'll cover this part later):

<pre><code>var user = {
	name: 'User Name',
	age: 7,
	active: true,
	address: {
		street: 'Some street',
		apartment: 15
	}
};

dataTier.Ties.create('userInfo', user);</code></pre>

The API to register an object/graph in the DataTier is Ties.<b>creaet</b> function which accepts 2 parameters: namespace as a string and initial data as an object.<br>
In order to have a views bound to this data we need to declare the ties in HTML also, it will go as following:

<pre><code>&lt;div&gt;
	&lt;span data-tie:"userInfo.name"&gt;&lt;/span&gt;
	&lt;span data-tie-text:"userInfo.age"&gt;&lt;/span&gt;
	&lt;input type="checkbox" data-tie-value="userInfo.active"/&gt;
	&lt;div&gt;
		&lt;input type="text" data-tie:"userInfo.address.street"/&gt;
		&lt;input type="text" data-tie:"userInfo.address.apartment"/&gt;
	&lt;/div&gt;
&lt;/div&gt;</code></pre>

Don't be confused with the diversity of variants of 'data' attributes - this is something to do with a concept of <b>rules</b> and will be covered later in docs, the main point here is that DOM elements are being tied to the data registered in DataTier by means of 'data' attributes with <b>path</b> values, which i also expand on in the documentation below.
There is no importance of the order of things, Javascript part may run before the HTML declarations and an opposite. HTML chunks with binding attributes may be injected/built later on, say on dynamic rendering of the pages.
Similarly, Javascript tying may be done as part of any later async flow, as well as untying in the case of need, to be sure.

Once two contracts exemplified above are done, you have the following:
<ul>
	<li>Any change in the data itself (model) will be reflected in all tied views</li>
	<li>Any change of values in input elements which invoke 'onchange' event (user driven changes, usually, but may be simulated from Javascript code as well, of course) will be reflected in the model, and propagate to all the relevant views</li>
	<li>Adding new HTML chunks having data ties setup will automatically pick up and reflect the model state</li>
	<li>Adding new data to the namespace or registering new namespaces with data will invode update of all the view waiting for that data</li>
</ul>

Going deeper - Concepts
=======================
