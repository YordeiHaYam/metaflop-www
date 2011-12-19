$(function () {

    // set background to corresponding inputs
    var setActiveInputs = function(inputField) {
        var suffix = (inputField.id || inputField[0].id).remove(/^\w+-/);
        $('.adjuster input').removeClass('active');
        $('input[id$=' + suffix + ']').addClass('active');
    }

    // increase/decrease the inputField's value
    var changeValue = function(inputField, cssClass){
        var number = cssClass.remove(/\D/g).toNumber() / 10.0;
        var method = cssClass.remove(/\d+$/);

        var value = inputField.val().toNumber() || 0;

        if (method == 'add') value = value + number;
        else if (method == 'sub') value = value - number;

        setValue(inputField, value);
    }

    var setValue = function(inputField, value) {
        if (!value && value !== 0){
            value = inputField.val() || 0;
        }

        value = String(value).replace(',', '.');

        inputField.val(value);
        // update the associated slider too
        if (value >= 0.1 && value <=1) {
        var sliderId = inputField.attr('id').replace('param-', 'slider-');
            $('#' + sliderId).val(value);
            fdSlider.updateSlider(sliderId);
        }

        previewImage();
    }

    var stripPercentSign = function(inputField) {
        var value = inputField.val().toNumber();
        if (value || value === 0) {
            inputField.val(value);
        }
    }

    var previewImage = function(){
        var previewBox = $('.preview-box.active');
        var loading = previewBox.find('.preview-loading');
        var loadingText = previewBox.find('.preview-loading-text');
        var image = previewBox.find('.preview-image');
        var content = previewBox.find('.preview-box-content');
        var previewType = previewBox.attr('id').remove('preview-');
        
        content.tipsy('hide');
        content.fadeTo(0, 0.5);
        loadingText.show();
        loading.spin('large');
        // http://stackoverflow.com/questions/4285042/can-jquery-ajax-load-image
        var url = '/preview/' + previewType + '?' + 
            $.makeArray($('input:text,textarea')).map(function(element){ 
                return element.id.remove('param-') + '=' + element.value
            })
            // add the selected character param
            .add('char-number' + '=' + ($('div.char-chooser a.active').attr('href') || '1').remove('#'))
            .join("&");
            
        image.attr('src', url).load(url, function(responseText, textStatus, XMLHttpRequest) {            
            content.fadeTo(0, 1);
            loadingText.hide();
            loading.spin(false);
            content.find('textarea').hide();
            
            if (textStatus == 'error') {
                content.tipsy({trigger: 'manual', fallback: 'The entered value is out of a valid range.\nPlease correct your parameters.', gravity: 's'}).tipsy('show');
            }
        });
    }

    var isAllowedTrailingCharacter = function(keyCode) {
        return [190, 188].some(keyCode);
    }
    
    var isAllowedMetaKey = function(keyCode) {
        return [16, 17, 18].some(keyCode) || // meta
               [46, 9, 35, 36, 37, 39].some(keyCode); // backspace, delete, tab, cursors
    }

    $('.adjuster input')
        .focus(function() {
            $this = $(this);
            setActiveInputs($this);
            stripPercentSign($this);
        })
        .keydown(function(event) {
            // allow backspace, delete, tab, cursors and metakeys
            if (isAllowedMetaKey(event.keyCode)) {
            }
            // allow delete
            else if (event.keyCode == 8){
                stripPercentSign($(this));
            }
            // up increase value
            else if (event.keyCode == 38) {
                changeValue($(this), 'add1');
            }
            // down decrease value
            else if (event.keyCode == 40) {
                changeValue($(this), 'sub1');
            }
            // allow decimal point (".", ",")
            else if (isAllowedTrailingCharacter(event.keyCode)) {
            }
            else {
                // stop keypress if NaN
                if ((event.keyCode < 48 || event.keyCode > 57) && (event.keyCode < 96 || event.keyCode > 105 )) {
                    event.preventDefault();
                }
            }

        })
        .keyup(function(event) {
            console.debug(event.keyCode, isAllowedTrailingCharacter(event.keyCode), [16, 17, 18].none(event.keyCode));
            
            // defer evaluation when allowed trailing characters (e.g. ".", wait for the next number)
            // ignore meta keys
            if (!(isAllowedTrailingCharacter(event.keyCode) || isAllowedMetaKey(event.keyCode))) {
                setValue($(this));
            }
        })
        .blur(function() {
            setValue($(this), null);
        });

    // toggle the +/- buttons for the inputs
    var parameterPanel = $('#parameter-panel');
    var parameterPanelInputs = parameterPanel.find('input');
    parameterPanelInputs.mouseover(function() {
        parameterPanel.find('a').hide();
        parameterPanelInputs.not(":focus").removeClass('active');
        
        $(this).addClass('active').siblings('a').show();
    });
    parameterPanel.find('.inputblock').mouseleave(function() {
        $(this).find('a').hide();
    });
    parameterPanel.find('.slider').mouseenter(function() {
        $(this).parent().find('a').hide();
    });
    
    $('.add1, .add10, .sub1, .sub10').click(function(e) {
        e.preventDefault();
        $this = $(this);
        var input = $this.parent().find('input');

        setActiveInputs(input);

        changeValue(input, $this.attr('class'));
        return false;
    });
    
    // sliders
    function updateValue(cbObj) {
        // update the associated input field
        $('#' + cbObj.elem.id.replace('slider-', 'param-')).val(cbObj.value).blur();
    }
    parameterPanel.find('.slider input').each(function() {
        fdSlider.createSlider({
            inp: this,
            step: "0.01",
            maxStep: 1, // (for keyboard users)
            min: 0.1,
            max: 1,
            animation:"timed",
            hideInput: true,
            callbacks:{
                "change":[updateValue]
            }
        });
    });
    
    
    // character chooser for single preview
    var charLinks = $('div.char-chooser a');
    charLinks.click(function(e) {
        e.preventDefault();
        
        charLinks.removeClass('active');
        $(this).addClass('active').blur();
        previewImage();
        
        return false;
    });
    charLinks.first().addClass('active');
    
    $('a.char-chooser').click(function(e) {
        e.preventDefault();
        var $this = $(this);
        var div = $('div.char-chooser');
        var activeItem = div.find('li.active');
        var items = div.find('li');
        
        var nextItem = $($this.hasClass('right') 
            ? activeItem.next()[0] || items.first()
            : activeItem.prev()[0] || items.last());
        
        items.removeClass('active');
        nextItem.addClass('active');
        div.scrollTo(nextItem, 400, { easing: 'easeInOutExpo', axis: "x" });
        
        return false;
    });
    
    // activate preview box
    $('.preview-box').click(function(e) {
        e.preventDefault();

        var $this = $(this);
        if ($this.not('.active').length > 0) {
            $('.preview-box.active').removeClass('active').find('textarea').hide();
            $this.addClass('active');
                        
            previewImage();
        }
        // show textarea
        else if ($this[0].id == 'preview-typewriter') {
            $this.find('textarea').show().focus();
        }
        
        return false;
    });
    
    $('.toggle-mode').click(function(e) {
        e.preventDefault();
        
        var $this = $(this);
        var textarea = $this.siblings('textarea');
        
        if ($this.hasClass('edit-mode')) {
            textarea.hide();
            previewImage();
            $this.attr('title', 'enter edit mode');
        }
        else {
            textarea.show();
            $this.attr('title', 'exit edit mode');
        }
        
        $this.toggleClass('edit-mode');
        
        return false;
    });
});

