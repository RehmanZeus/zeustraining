## Answers

### HTML
- What is HTML? Give basic structure of the HTML page. 
    HTML (HyperText Markup Language) is the standard markup language used to structure and design web pages. It defines how text, images, and multimedia content are displayed in a web browser.

    Basic Structure
    - `<!DOCTYPE html>`
    Declares the document type and version of HTML, ensuring proper rendering by browsers.

    - `<html>`
    The root element that encompasses all other HTML elements, indicating the beginning and end of the document.

    `<head>`
    It contains meta-information about the HTML page.

    - `<title> `
    Sets the title of the webpage, which appears on the browser's title bar or tab.

    - `<body>`
    Encloses all the visible content of the webpage, including text, images, links, and other media.

    - Tags
    Keywords enclosed in angle brackets (e.g., `<p>, <a>`) that define elements within the document.

    - Attributes
    Provide additional information about elements, specified within the opening tag (e.g., href in `<a href="url">`).

    - Elements
    It is a collection of start and end tags with the content inserted in between them.

    - Heading
    Defined by `<h1> to <h6>` tags, representing six levels of headings, with `<h1>` being the highest and `<h6>` the lowest.

- Difference between inline and block level element

    - `Block Element`
    A block-level element always starts on a new line, and the browsers automatically add some space (a margin) before and after the element.
    ex. `p` and `div` tags

    - `Inline Element`
    An inline element does not start on a new line.
    An inline element only takes up as much width as necessary.
    ex. `span` tag


### CSS

- Explain the different ways in which CSS can be applied to HTML, what is the preferred way and why.

    - Different ways to apply CSS are as follow:
        - Inline
        - External
        - Internal
    - The preferred way to apply CSS is `External CSS` because of `reusability`, `maintainibility`, etc.

- What are different CSS selectors, with example explain Element, Class and id selectors

    - CSS selectors define which elements a style applies to. Here are three fundamental types:

    - Different types of CSS selectors are as follows
        - Element selector
            ```bash
                p {
                    color: blue;
                }

            ```
        - Class selector
            ```bash
                .highlight {
                    background-color: yellow;
                }
            ```
        - ID selector
            ```bash
                `#header {
                    font-size: 24px;
                    font-weight: bold;
                }`
            ```


### JavaScript

- List down ways in which JavaScript command can be added to a webpage, what is the preferred way.

    - Inline
        ```bash
            <button onclick="alert('Hello!')">Click Me</button>
        ```
    - Internal
        ```bash
            <script>
                console.log('Hello from internal JavaScript!');
            </script>
        ```
    - External
        ```bash
            <script src="script.js"></script>
        ```
    
    - Preferred Way `External` Promotes `redability`, `maintainability`.